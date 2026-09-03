import pool from "../db.js";

import {
  extractBearerToken,
  mapUserProfile,
  verifyAuthToken,
} from "../utils/auth.js";

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
        u.created_at,
        u.updated_at,

        e.employee_code,
        e.designation,
        e.employment_status AS employee_status,
        e.department_id,

        d.name AS department_name,

        COALESCE(
          JSON_AGG(DISTINCT r.name) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) AS roles,

        COALESCE(
          JSON_AGG(DISTINCT p.name) FILTER (WHERE p.id IS NOT NULL),
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

      roles:
        user.roles ?? [],

      permissions:
        user.permissions ?? [],

      company_id:
        user.company_id,

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
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const hasRole =
      allowedRoles.some(
        (role) =>
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
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
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
 * Verify company scope - ensures user can only access resources in their company
 */
export const verifyCompanyScope =
  async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // Super admin can access all companies
    if (isSuperAdmin(req.user)) {
      return next();
    }

    // Get company ID from request
    // header, params, or body
    const companyId =
      req.headers["x-company-id"] ||
      req.params.companyId ||
      req.body?.companyId;

    if (!companyId) {
      // If no company ID specified,
      // use user's primary company
      if (!req.user.company_id) {
        return forbidden(
          res,
          "No company context available",
        );
      }

      req.user.requestedCompanyId =
        req.user.company_id;

      return next();
    }

    // Check if user has access
    // to requested company
    const hasAccess =
      await userHasCompanyAccess(
        req.user.id,
        Number(companyId),
      );

    if (!hasAccess) {
      return forbidden(
        res,
        "You do not have access to this company",
      );
    }

    req.user.requestedCompanyId =
      Number(companyId);

    next();
  };