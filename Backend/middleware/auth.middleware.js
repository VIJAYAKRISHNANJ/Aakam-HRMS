import pool from "../db.js";

import {
  extractBearerToken,
  mapUserProfile,
  verifyAuthToken,
} from "../utils/auth.js";

export const CANONICAL_ROLES = new Set([
  "SUPER_ADMINISTRATOR",
  "COMPANY_ADMINISTRATOR",
  "HR_ADMINISTRATOR",
  "RECRUITER",
  "PAYROLL_ADMINISTRATOR",
  "MANAGER",
  "EMPLOYEE",
  "CLIENT_USER",
]);

export const canonicalizeRole = (role) => {
  const normalized = String(role ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  return CANONICAL_ROLES.has(normalized)
    ? normalized
    : null;
};

const canonicalizeRoles = (roles) =>
  [
    ...new Set(
      (roles ?? [])
        .map(canonicalizeRole)
        .filter(Boolean),
    ),
  ];

const getUserWithAccess = async (userId) => {
  const result = await pool.query(
    `
      SELECT
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.employee_id,
        u.is_active,
        u.failed_login_attempts,
        u.locked_until,
        u.last_login_at,
        u.password_changed_at,
        u.password_expires_at,
        u.company_id,
        u.client_id,
        u.created_at,
        u.updated_at,

        e.employee_code,
        e.designation,
        e.employment_status AS employee_status,
        e.department_id,

        d.name AS department_name,

        COALESCE(
          JSON_AGG(DISTINCT r.name)
          FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) AS roles,

        COALESCE(
          JSON_AGG(DISTINCT p.name)
          FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS permissions

      FROM users u

      LEFT JOIN employees e
        ON e.id = u.employee_id

      LEFT JOIN departments d
        ON d.id = e.department_id

      LEFT JOIN user_roles ur
        ON ur.user_id = u.id

      LEFT JOIN roles r
        ON r.id = ur.role_id

      LEFT JOIN role_permissions rp
        ON rp.role_id = r.id

      LEFT JOIN permissions p
        ON p.id = rp.permission_id

      WHERE u.id = $1

      GROUP BY
        u.id,
        e.employee_code,
        e.designation,
        e.employment_status,
        e.department_id,
        d.name

      LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] ?? null;
};

const unauthorized = (
  res,
  message = "Authentication required",
) =>
  res.status(401).json({
    success: false,
    message,
  });

const forbidden = (
  res,
  message = "Insufficient access",
) =>
  res.status(403).json({
    success: false,
    message,
  });

/**
 * Get user's accessible companies
 */
export const getUserCompanies = async (
  userId,
) => {
  const result = await pool.query(
    `
      SELECT DISTINCT
        c.id,
        c.company_code,
        c.legal_name,
        c.display_name
      FROM companies c
      LEFT JOIN user_companies uc
        ON c.id = uc.company_id
      LEFT JOIN users u
        ON uc.user_id = u.id
        OR (
          u.company_id = c.id
          AND u.id = $1
        )
      WHERE u.id = $1
      ORDER BY c.id;
    `,
    [userId],
  );

  return result.rows;
};

/**
 * Check if user has access to a specific company
 */
export const userHasCompanyAccess = async (
  userId,
  companyId,
) => {
  const result = await pool.query(
    `
      SELECT 1
      FROM (
        SELECT c.id
        FROM companies c
        LEFT JOIN user_companies uc
          ON c.id = uc.company_id
        LEFT JOIN users u
          ON (
            uc.user_id = u.id
            OR u.company_id = c.id
          )
        WHERE u.id = $1
          AND c.id = $2
      ) AS access
      LIMIT 1;
    `,
    [userId, companyId],
  );

  return result.rows.length > 0;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (
  user,
) =>
  user?.roles?.includes(
    "SUPER_ADMINISTRATOR",
  );

/**
 * Check if user is company admin
 */
export const isCompanyAdmin = (
  user,
) =>
  user?.roles?.includes(
    "COMPANY_ADMINISTRATOR",
  );

export const authenticate = async (
  req,
  res,
  next,
) => {
  try {
    const token =
      extractBearerToken(
        req.headers.authorization,
      );

    if (!token) {
      return unauthorized(
        res,
        "Missing or invalid authorization token",
      );
    }

    let payload;

    try {
      payload =
        verifyAuthToken(token);
    } catch (error) {
      return unauthorized(
        res,
        "Invalid or expired token",
      );
    }

    const user =
      await getUserWithAccess(
        payload.sub,
      );

    if (!user) {
      return unauthorized(
        res,
        "Authenticated user not found",
      );
    }

    if (!user.is_active) {
      return unauthorized(
        res,
        "User account is inactive",
      );
    }

    req.user = {
      ...mapUserProfile(user),

      roles: canonicalizeRoles(
        user.roles,
      ),

      permissions:
        user.permissions ?? [],

      company_id:
        user.company_id,

      client_id:
        user.client_id,

      tokenPayload:
        payload,
    };

    next();
  } catch (error) {
    console.error(
      "Authentication middleware error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to authenticate request",
    });
  }
};

export const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }

    /*
     * SUPER_ADMINISTRATOR has unrestricted
     * role access.
     *
     * This prevents module-specific role
     * restrictions from blocking the platform
     * administrator.
     */
    if (isSuperAdmin(req.user)) {
      return next();
    }

    const normalizedAllowedRoles =
      allowedRoles.map(
        (role) =>
          canonicalizeRole(role),
      );

    const hasRole =
      normalizedAllowedRoles.some(
        (role) =>
          role &&
          req.user.roles.includes(
            role,
          ),
      );

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message:
          "Insufficient role access",
      });
    }

    next();
  };

export const authorizePermissions =
  (...requiredPermissions) =>
  (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }

    /*
     * SUPER_ADMINISTRATOR has unrestricted
     * permission access.
     *
     * The admin therefore does not depend on
     * individual permission names such as:
     *
     * workforce.view
     * employees.view
     * company.view
     * companies.view
     * exit.view
     * offboarding.view
     *
     * This avoids legacy/current permission-name
     * differences from blocking the administrator.
     */
    if (isSuperAdmin(req.user)) {
      return next();
    }

    const hasAllPermissions =
      requiredPermissions.every(
        (permission) =>
          req.user.permissions.includes(
            permission,
          ),
      );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message:
          "Insufficient permission access",
      });
    }

    next();
  };

/**
 * Route-level permission gate.
 *
 * Keep this at the API boundary so adding a new
 * handler cannot accidentally make it available
 * to every authenticated user.
 */
export const authorizeResource =
  (resource) =>
  (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }

    /*
     * SUPER_ADMINISTRATOR has unrestricted
     * resource access.
     *
     * This must happen before resource/action
     * permission-name calculation so the admin
     * is not affected by differences such as:
     *
     * employees -> workforce
     * company -> companies
     * exits -> offboarding
     * recruitment/candidates -> candidates
     */
    if (isSuperAdmin(req.user)) {
      req.authorization = {
        resource,
        action: "manage",
        ownOnly: false,
        superAdmin: true,
      };

      return next();
    }

    const method =
      req.method.toUpperCase();

    const path =
      req.path.toLowerCase();

    let action =
      ({
        GET: "view",
        POST: "create",
        PUT: "update",
        PATCH: "update",
        DELETE: "delete",
      })[method];

    if (
      resource === "payroll" &&
      /\/(approve|validate|process)/.test(
        path,
      )
    ) {
      action = "approve";
    }

    if (
      resource === "leave" &&
      /\/(approve|reject)/.test(
        path,
      )
    ) {
      action = "approve";
    }

    if (
      resource === "exits" &&
      /\/(approve|settlement)/.test(
        path,
      )
    ) {
      action = "approve";
    }

    if (
      resource === "recruitment" &&
      path.includes("/candidates")
    ) {
      resource = "candidates";
    }

    const permissionResource =
      {
        exits: "offboarding",
        reports: "reports",
        dashboard: "dashboard",
        companies: "company",
      }[resource] ?? resource;

    const permission =
      `${permissionResource}.${action}`;

    const ownPermission =
      `${permissionResource}.view.own`;

    /*
     * "manage" is an established, broader grant
     * in the existing permission model.
     */
    const legacyPermission =
      resource === "dashboard"
        ? "reports.view"
        : null;

    const hasPermission =
      req.user.permissions.includes(
        permission,
      ) ||
      req.user.permissions.includes(
        `${permissionResource}.manage`,
      ) ||
      (
        legacyPermission &&
        req.user.permissions.includes(
          legacyPermission,
        )
      ) ||
      (
        method === "GET" &&
        req.user.permissions.includes(
          ownPermission,
        )
      );

    if (!hasPermission) {
      return forbidden(
        res,
        "Insufficient permission access",
      );
    }

    req.authorization = {
      resource,
      action,
      ownOnly:
        method === "GET" &&
        !req.user.permissions.includes(
          permission,
        ),
    };

    next();
  };

const resourceEmployeeColumn = {
  employees: "id",
  attendance: "employee_id",
  leave: "employee_id",
  payroll: "employee_id",
  performance: "employee_id",
  training: "employee_id",
  exits: "employee_id",
};

/**
 * Assert a direct resource belongs to the
 * authenticated employee or manager's team.
 */
export const verifyEmployeeResourceScope =
  (
    table,
    idParam = "id",
  ) =>
  async (
    req,
    res,
    next,
  ) => {
    try {
      /*
       * SUPER_ADMINISTRATOR can access resources
       * across companies.
       */
      if (
        isSuperAdmin(req.user) ||
        !req.params[idParam]
      ) {
        return next();
      }

      const column =
        resourceEmployeeColumn[
          table
        ];

      if (
        !column ||
        !/^[1-9]\d*$/.test(
          String(
            req.params[idParam],
          ),
        )
      ) {
        return forbidden(res);
      }

      const result =
        await pool.query(
          `
            SELECT e.id
            FROM ${
              table === "employees"
                ? "employees"
                : table === "exits"
                  ? "exit_records"
                  : `${table}_records`
            } r
            JOIN employees e
              ON e.id = r.${column}
            WHERE r.id = $1
              AND e.company_id = $2
              AND (
                e.id = $3
                OR e.reporting_manager_id = $3
              )
            LIMIT 1
          `,
          [
            Number(
              req.params[
                idParam
              ],
            ),
            req.user
              .requestedCompanyId,
            req.user.employee_id,
          ],
        );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Resource not found",
        });
      }

      next();
    } catch (error) {
      console.error(
        "Employee scope middleware error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to authorize resource access",
      });
    }
  };

/**
 * CLIENT_USER may only address its
 * server-linked client and its job requirements.
 */
export const verifyClientScope =
  async (
    req,
    res,
    next,
  ) => {
    try {
      if (
        !req.user?.roles?.includes(
          "CLIENT_USER",
        ) ||
        isSuperAdmin(req.user)
      ) {
        return next();
      }

      if (!req.user.client_id) {
        return forbidden(
          res,
          "Client account is not linked to a client",
        );
      }

      const id =
        Number(req.params.id);

      const path =
        req.baseUrl +
        req.path;

      /*
       * Collection routes are authorized by their
       * route-specific, server-side company/client
       * filters. Do not reject them before those
       * filters run.
       */
      if (
        !Number.isInteger(id) ||
        id < 1
      ) {
        return next();
      }

      if (
        path.startsWith(
          "/api/clients",
        )
      ) {
        if (
          id !==
          Number(
            req.user.client_id,
          )
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Resource not found",
          });
        }

        return next();
      }

      if (
        path.startsWith(
          "/api/recruitment/jobs",
        )
      ) {
        const result =
          await pool.query(
            `
              SELECT 1
              FROM job_positions
              WHERE id = $1
                AND client_id = $2
                AND company_id = $3
              LIMIT 1;
            `,
            [
              id,
              req.user.client_id,
              req.user.requestedCompanyId,
            ],
          );

        if (result.rows.length) {
          return next();
        }
      }

      return res.status(404).json({
        success: false,
        message:
          "Resource not found",
      });
    } catch (error) {
      console.error(
        "Client scope middleware error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to authorize client access",
      });
    }
  };

/**
 * Verify company scope - ensures user can
 * only access resources in their company.
 */
export const verifyCompanyScope =
  async (
    req,
    res,
    next,
  ) => {
    if (!req.user) {
      return unauthorized(res);
    }

    /*
     * Super admins may select one existing
     * company explicitly, or omit the header
     * for platform-wide queries.
     *
     * Other request fields never select scope.
     */
    if (isSuperAdmin(req.user)) {
      const requested =
        req.headers[
          "x-company-id"
        ];

      if (
        requested !==
        undefined
      ) {
        if (
          !/^[1-9]\d*$/.test(
            String(requested),
          )
        ) {
          return forbidden(
            res,
            "Invalid company context",
          );
        }

        const company =
          await pool.query(
            `
              SELECT 1
              FROM companies
              WHERE id = $1
              LIMIT 1
            `,
            [
              Number(requested),
            ],
          );

        if (!company.rows.length) {
          return forbidden(
            res,
            "Invalid company context",
          );
        }

        req.user.requestedCompanyId =
          Number(requested);
      } else {
        req.user.requestedCompanyId =
          null;
      }

      return next();
    }

    /*
     * Ordinary accounts never switch tenant from
     * a header, parameter, query, or body field.
     * Their primary company is the authorization
     * source.
     */
    if (!req.user.company_id) {
      return forbidden(
        res,
        "No company context available",
      );
    }

    req.user.requestedCompanyId =
      Number(
        req.user.company_id,
      );

    next();
  };