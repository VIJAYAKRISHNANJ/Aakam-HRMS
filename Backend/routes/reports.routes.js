import express from "express";
import pool from "../db.js";

const router = express.Router();

const ROLE = {
  SUPER_ADMIN: "SUPER_ADMINISTRATOR",
  COMPANY_ADMIN: "COMPANY_ADMINISTRATOR",
  HR_ADMIN: "HR_ADMINISTRATOR",
  RECRUITER: "RECRUITER",
  PAYROLL_ADMIN: "PAYROLL_ADMINISTRATOR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  CLIENT_USER: "CLIENT_USER",
};

const hasRole = (req, role) => req.user?.roles?.includes(role) === true;

const hasAnyRole = (req, roles) =>
  roles.some((role) => hasRole(req, role));

const isSuperAdmin = (req) =>
  hasRole(req, ROLE.SUPER_ADMIN);

const isCompanyAdmin = (req) =>
  hasRole(req, ROLE.COMPANY_ADMIN);

const isHrAdmin = (req) =>
  hasRole(req, ROLE.HR_ADMIN);

const isManagerScope = (req) =>
  !isSuperAdmin(req) &&
  !isCompanyAdmin(req) &&
  !isHrAdmin(req) &&
  hasRole(req, ROLE.MANAGER);

const isEmployeeScope = (req) =>
  !isSuperAdmin(req) &&
  !isCompanyAdmin(req) &&
  !isHrAdmin(req) &&
  !isManagerScope(req) &&
  hasRole(req, ROLE.EMPLOYEE);

const isClientScope = (req) =>
  !isSuperAdmin(req) &&
  !isCompanyAdmin(req) &&
  !isHrAdmin(req) &&
  !hasRole(req, ROLE.RECRUITER) &&
  hasRole(req, ROLE.CLIENT_USER);

const positiveIdOrFallback = (value) => {
  const id = Number(value);

  return Number.isInteger(id) && id > 0
    ? id
    : -1;
};

const ownCompanyId = (req) =>
  positiveIdOrFallback(req.user?.requestedCompanyId);

const ownEmployeeId = (req) =>
  positiveIdOrFallback(req.user?.employee_id);

const ownClientId = (req) =>
  positiveIdOrFallback(req.user?.client_id);

const assertReportAccess = (
  req,
  res,
  allowedRoles,
) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return false;
  }

  if (!hasAnyRole(req, allowedRoles)) {
    res.status(403).json({
      success: false,
      message: "Insufficient report access",
    });

    return false;
  }

  return true;
};

const isValidId = (value) =>
  /^\d+$/.test(String(value)) &&
  Number(value) > 0;

const isValidDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00Z`,
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const parseFilters = (
  query,
  allowed = [],
) => {
  const {
    startDate = "",
    endDate = "",
    departmentId = "",
    companyId = "",
    branchId = "",
  } = query;

  if (
    startDate &&
    !isValidDate(startDate)
  ) {
    return {
      error:
        "Invalid startDate. Use YYYY-MM-DD format",
    };
  }

  if (
    endDate &&
    !isValidDate(endDate)
  ) {
    return {
      error:
        "Invalid endDate. Use YYYY-MM-DD format",
    };
  }

  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {
    return {
      error:
        "startDate cannot be after endDate",
    };
  }

  for (const [
    name,
    value,
  ] of [
    ["departmentId", departmentId],
    ["companyId", companyId],
    ["branchId", branchId],
  ]) {
    if (
      value &&
      !isValidId(value)
    ) {
      return {
        error: `Invalid ${name}`,
      };
    }

    if (
      value &&
      !allowed.includes(name)
    ) {
      return {
        error:
          `${name} is not supported for this report`,
      };
    }
  }

  if (
    startDate &&
    !allowed.includes("date")
  ) {
    return {
      error:
        "Date filters are not supported for this report",
    };
  }

  if (
    endDate &&
    !allowed.includes("date")
  ) {
    return {
      error:
        "Date filters are not supported for this report",
    };
  }

  return {
    filters: {
      startDate,
      endDate,
      departmentId: departmentId
        ? Number(departmentId)
        : null,
      companyId: companyId
        ? Number(companyId)
        : null,
      branchId: branchId
        ? Number(branchId)
        : null,
    },
  };
};

const dateConditions = (
  filters,
  column,
  values,
  overlap = false,
) => {
  const conditions = [];

  if (filters.startDate) {
    values.push(filters.startDate);

    conditions.push(
      overlap
        ? `${column.end} >= $${values.length}`
        : `${column} >= $${values.length}`,
    );
  }

  if (filters.endDate) {
    values.push(filters.endDate);

    conditions.push(
      overlap
        ? `${column.start} <= $${values.length}`
        : `${column} <= $${values.length}`,
    );
  }

  return conditions;
};

const withWhere = (conditions) =>
  conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

/**
 * Add tenant/company scope.
 *
 * SUPER_ADMINISTRATOR is intentionally not restricted here because
 * that role is the platform-wide administrator.
 */
const addTenantScope = (
  req,
  values,
  conditions,
  column,
) => {
  if (isSuperAdmin(req)) {
    return;
  }

  values.push(ownCompanyId(req));

  conditions.push(
    `${column} = $${values.length}`,
  );
};

/**
 * Employee-backed scope:
 *
 * Manager  -> direct reports
 * Employee -> self
 *
 * Company Admin / HR Admin / Super Admin remain company-wide.
 */
const addEmployeeVisibilityScope = (
  req,
  values,
  conditions,
  alias = "e",
) => {
  if (isManagerScope(req)) {
    values.push(ownEmployeeId(req));

    conditions.push(
      `${alias}.reporting_manager_id = $${values.length}`,
    );
  } else if (isEmployeeScope(req)) {
    values.push(ownEmployeeId(req));

    conditions.push(
      `${alias}.id = $${values.length}`,
    );
  }
};

/**
 * Recruitment scope:
 *
 * Internal users -> company
 * CLIENT_USER   -> company + linked client
 */
const addRecruitmentScope = (
  req,
  values,
  conditions,
  jobAlias = "jp",
) => {
  addTenantScope(
    req,
    values,
    conditions,
    `${jobAlias}.company_id`,
  );

  if (isClientScope(req)) {
    values.push(ownClientId(req));

    conditions.push(
      `${jobAlias}.client_id = $${values.length}`,
    );
  }
};

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) {
    return value;
  }

  return `${value.getFullYear()}-${String(
    value.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
};

/* =========================================================
   REPORT SUMMARY

   Company Admin / HR Admin / Super Admin only.
========================================================= */

router.get(
  "/summary",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
        ],
      )
    ) {
      return;
    }

    try {
      const values = [];

      let companyId = null;

      if (!isSuperAdmin(req)) {
        values.push(ownCompanyId(req));
        companyId = "$1";
      }

      const employeeScope = companyId
        ? `WHERE e.company_id = ${companyId}`
        : "";

      const employeeActiveScope = companyId
        ? `${employeeScope} AND e.employment_status = 'ACTIVE'`
        : "WHERE e.employment_status = 'ACTIVE'";

      const positionScope = companyId
        ? `WHERE jp.company_id = ${companyId}`
        : "";

      const positionOpenScope = companyId
        ? `${positionScope} AND jp.status = 'OPEN'`
        : "WHERE jp.status = 'OPEN'";

      const candidateScope = companyId
        ? `WHERE c.company_id = ${companyId}`
        : "";

      const onboardingScope = companyId
        ? `WHERE o.company_id = ${companyId}`
        : "";

      const payrollScope = companyId
        ? `WHERE pr.company_id = ${companyId}`
        : "";

      const performanceScope = companyId
        ? `WHERE e.company_id = ${companyId}`
        : "";

      const programScope = companyId
        ? `WHERE tp.company_id = ${companyId}`
        : "";

      const enrollmentScope = companyId
        ? `WHERE te.company_id = ${companyId}`
        : "";

      const result =
        await pool.query(
          `
            SELECT

              (
                SELECT COUNT(*)
                FROM employees e
                ${employeeScope}
              ) AS total_employees,

              (
                SELECT COUNT(*)
                FROM employees e
                ${employeeActiveScope}
              ) AS active_employees,

              (
                SELECT COUNT(*)
                FROM job_positions jp
                ${positionScope}
              ) AS total_positions,

              (
                SELECT COUNT(*)
                FROM job_positions jp
                ${positionOpenScope}
              ) AS open_positions,

              (
                SELECT COUNT(*)
                FROM candidates c
                ${candidateScope}
              ) AS total_candidates,

              (
                SELECT COUNT(*)
                FROM onboardings o
                ${onboardingScope}
              ) AS total_onboardings,

              (
                SELECT COUNT(*)
                FROM payroll_runs pr
                ${payrollScope}
              ) AS total_payroll_runs,

              (
                SELECT COUNT(*)
                FROM performance_reviews pr
                INNER JOIN employees e
                  ON e.id = pr.employee_id
                ${performanceScope}
              ) AS total_performance_reviews,

              (
                SELECT COUNT(*)
                FROM training_programs tp
                ${programScope}
              ) AS total_training_programs,

              (
                SELECT COUNT(*)
                FROM training_enrollments te
                ${enrollmentScope}
              ) AS total_training_enrollments;
          `,
          values,
        );

      const row = result.rows[0];

      res.json({
        success: true,
        data: {
          workforce: {
            totalEmployees:
              Number(row.total_employees),

            activeEmployees:
              Number(row.active_employees),
          },

          recruitment: {
            totalPositions:
              Number(row.total_positions),

            openPositions:
              Number(row.open_positions),

            totalCandidates:
              Number(row.total_candidates),
          },

          onboarding: {
            totalOnboardings:
              Number(row.total_onboardings),
          },

          payroll: {
            totalPayrollRuns:
              Number(row.total_payroll_runs),
          },

          performance: {
            totalReviews:
              Number(row.total_performance_reviews),
          },

          training: {
            totalPrograms:
              Number(row.total_training_programs),

            totalEnrollments:
              Number(row.total_training_enrollments),
          },
        },
      });
    } catch (error) {
      console.error(
        "Reports summary error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load reports summary",
      });
    }
  },
);

/* =========================================================
   WORKFORCE REPORT

   Company/HR/Super Admin -> company-wide
   Manager                -> direct reports
   Employee               -> self
========================================================= */

router.get(
  "/workforce",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.MANAGER,
          ROLE.EMPLOYEE,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          [
            "date",
            "departmentId",
          ],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const employeeValues = [];

      const employeeConditions =
        dateConditions(
          filters,
          "e.joining_date",
          employeeValues,
        );

      addTenantScope(
        req,
        employeeValues,
        employeeConditions,
        "e.company_id",
      );

      if (filters.departmentId) {
        employeeValues.push(
          filters.departmentId,
        );

        employeeConditions.push(
          `e.department_id = $${employeeValues.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        employeeValues,
        employeeConditions,
        "e",
      );

      const departmentValues = [];

      const departmentConditions =
        dateConditions(
          filters,
          "e.joining_date",
          departmentValues,
        );

      addTenantScope(
        req,
        departmentValues,
        departmentConditions,
        "d.company_id",
      );

      if (filters.departmentId) {
        departmentValues.push(
          filters.departmentId,
        );

        departmentConditions.push(
          `d.id = $${departmentValues.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        departmentValues,
        departmentConditions,
        "e",
      );

      const companyValues = [];
      const companyConditions = [];

      addTenantScope(
        req,
        companyValues,
        companyConditions,
        "c.id",
      );

      const branchValues = [];
      const branchConditions = [];

      addTenantScope(
        req,
        branchValues,
        branchConditions,
        "b.company_id",
      );

      const [
        totals,
        departments,
        companies,
        branches,
      ] = await Promise.all([
        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE e.employment_status = 'ACTIVE'
                ) AS active,

              COUNT(*)
                FILTER (
                  WHERE e.employment_status <> 'ACTIVE'
                ) AS inactive

            FROM employees e

            ${withWhere(
              employeeConditions,
            )};
          `,
          employeeValues,
        ),

        pool.query(
          `
            SELECT
              d.id,
              d.name,
              d.code,
              COUNT(e.id) AS employee_count

            FROM departments d

            LEFT JOIN employees e
              ON e.department_id = d.id
              AND e.company_id = d.company_id

            ${withWhere(
              departmentConditions,
            )}

            GROUP BY
              d.id,
              d.name,
              d.code

            ORDER BY d.name;
          `,
          departmentValues,
        ),

        pool.query(
          `
            SELECT
              c.id,
              c.company_code,
              c.display_name,
              c.legal_name

            FROM companies c

            ${withWhere(
              companyConditions,
            )}

            ORDER BY
              c.display_name,
              c.id;
          `,
          companyValues,
        ),

        pool.query(
          `
            SELECT
              b.id,
              b.company_id,
              c.display_name AS company_name,
              b.branch_code,
              b.branch_name,
              COALESCE(
                b.location,
                b.address
              ) AS location

            FROM branches b

            INNER JOIN companies c
              ON c.id = b.company_id

            ${withWhere(
              branchConditions,
            )}

            ORDER BY
              c.display_name,
              b.branch_name;
          `,
          branchValues,
        ),
      ]);

      res.json({
        success: true,

        data: {
          totals: {
            totalEmployees:
              Number(
                totals.rows[0].total,
              ),

            activeEmployees:
              Number(
                totals.rows[0].active,
              ),

            inactiveEmployees:
              Number(
                totals.rows[0].inactive,
              ),
          },

          byDepartment:
            departments.rows.map(
              (row) => ({
                id: Number(row.id),
                name: row.name,
                code: row.code,
                employeeCount:
                  Number(
                    row.employee_count,
                  ),
              }),
            ),

          byCompany:
            companies.rows.map(
              (row) => ({
                id: Number(row.id),
                companyCode:
                  row.company_code,

                name:
                  row.display_name ||
                  row.legal_name,

                employeeCount: null,
              }),
            ),

          byBranch:
            branches.rows.map(
              (row) => ({
                id: Number(row.id),
                companyId:
                  Number(row.company_id),

                companyName:
                  row.company_name,

                branchCode:
                  row.branch_code,

                name:
                  row.branch_name,

                location:
                  row.location,

                employeeCount: null,
              }),
            ),

          companyBranchLimitation:
            "Employee branch relationships are not exposed by the current employee API, so employee counts by branch remain unavailable.",
        },
      });
    } catch (error) {
      console.error(
        "Workforce report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load workforce report",
      });
    }
  },
);

/* =========================================================
   DEPARTMENT REPORT

   Company/HR/Super Admin -> company-wide
   Manager                -> direct reports only
========================================================= */

router.get(
  "/departments",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.MANAGER,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          [
            "date",
            "departmentId",
          ],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const values = [];
      const conditions = [];

      addTenantScope(
        req,
        values,
        conditions,
        "d.company_id",
      );

      if (filters.departmentId) {
        values.push(
          filters.departmentId,
        );

        conditions.push(
          `d.id = $${values.length}`,
        );
      }

      if (filters.startDate) {
        values.push(filters.startDate);

        conditions.push(
          `e.joining_date >= $${values.length}`,
        );
      }

      if (filters.endDate) {
        values.push(filters.endDate);

        conditions.push(
          `e.joining_date <= $${values.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        values,
        conditions,
        "e",
      );

      const result =
        await pool.query(
          `
            SELECT
              d.id,
              d.name,
              d.code,

              COUNT(e.id) AS total_employees,

              COUNT(e.id)
                FILTER (
                  WHERE e.employment_status = 'ACTIVE'
                ) AS active_employees,

              COUNT(e.id)
                FILTER (
                  WHERE e.employment_status <> 'ACTIVE'
                ) AS inactive_employees

            FROM departments d

            LEFT JOIN employees e
              ON e.department_id = d.id
              AND e.company_id = d.company_id

            ${withWhere(conditions)}

            GROUP BY
              d.id,
              d.name,
              d.code

            ORDER BY d.name;
          `,
          values,
        );

      res.json({
        success: true,

        data: result.rows.map(
          (row) => ({
            id: Number(row.id),
            name: row.name,
            code: row.code,

            totalEmployees:
              Number(
                row.total_employees,
              ),

            activeEmployees:
              Number(
                row.active_employees,
              ),

            inactiveEmployees:
              Number(
                row.inactive_employees,
              ),
          }),
        ),
      });
    } catch (error) {
      console.error(
        "Department report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load department report",
      });
    }
  },
);
/* =========================================================
   DEPARTMENT REPORT

   Company/HR/Super Admin -> company-wide
   Manager                -> direct reports only
========================================================= */

router.get(
  "/departments",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.MANAGER,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          [
            "date",
            "departmentId",
          ],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const values = [];

      const conditions =
        dateConditions(
          filters,
          "e.joining_date",
          values,
        );

      addTenantScope(
        req,
        values,
        conditions,
        "d.company_id",
      );

      if (filters.departmentId) {
        values.push(
          filters.departmentId,
        );

        conditions.push(
          `d.id = $${values.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        values,
        conditions,
        "e",
      );

      const result =
        await pool.query(
          `
            SELECT
              d.id,
              d.name,
              d.code,
              COUNT(e.id) AS employee_count

            FROM departments d

            LEFT JOIN employees e
              ON e.department_id = d.id
              AND e.company_id = d.company_id

            ${withWhere(conditions)}

            GROUP BY
              d.id,
              d.name,
              d.code

            ORDER BY d.name;
          `,
          values,
        );

      res.json({
        success: true,

        data:
          result.rows.map(
            (row) => ({
              id: Number(row.id),
              name: row.name,
              code: row.code,
              employeeCount:
                Number(
                  row.employee_count,
                ),
            }),
          ),

        total:
          result.rows.length,
      });
    } catch (error) {
      console.error(
        "Department report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load department report",
      });
    }
  },
);

/* =========================================================
   COMPANY / BRANCH REPORT

   Super Admin -> all companies or requested company
   Company/HR  -> own company only
========================================================= */

router.get(
  "/companies",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          ["companyId"],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      if (
        !isSuperAdmin(req) &&
        filters.companyId &&
        filters.companyId !==
          ownCompanyId(req)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot access another company's reports",
        });
      }

      const companyValues = [];
      const companyConditions = [];

      if (isSuperAdmin(req)) {
        if (filters.companyId) {
          companyValues.push(
            filters.companyId,
          );

          companyConditions.push(
            `c.id = $${companyValues.length}`,
          );
        }
      } else {
        companyValues.push(
          ownCompanyId(req),
        );

        companyConditions.push(
          `c.id = $${companyValues.length}`,
        );
      }

      const branchValues = [];
      const branchConditions = [];

      if (isSuperAdmin(req)) {
        if (filters.companyId) {
          branchValues.push(
            filters.companyId,
          );

          branchConditions.push(
            `b.company_id = $${branchValues.length}`,
          );
        }
      } else {
        branchValues.push(
          ownCompanyId(req),
        );

        branchConditions.push(
          `b.company_id = $${branchValues.length}`,
        );
      }

      const [
        companies,
        branches,
      ] = await Promise.all([
        pool.query(
          `
            SELECT
              c.id,
              c.company_code,
              c.display_name,
              c.legal_name

            FROM companies c

            ${withWhere(
              companyConditions,
            )}

            ORDER BY
              c.display_name,
              c.id;
          `,
          companyValues,
        ),

        pool.query(
          `
            SELECT
              b.id,
              b.company_id,
              b.branch_code,
              b.branch_name,
              COALESCE(
                b.location,
                b.address
              ) AS location,
              c.display_name AS company_name

            FROM branches b

            INNER JOIN companies c
              ON c.id = b.company_id

            ${withWhere(
              branchConditions,
            )}

            ORDER BY
              c.display_name,
              b.branch_name;
          `,
          branchValues,
        ),
      ]);

      res.json({
        success: true,

        data: {
          companies:
            companies.rows.map(
              (row) => ({
                id: Number(row.id),
                companyCode:
                  row.company_code,

                name:
                  row.display_name ||
                  row.legal_name,

                employeeCount: null,
              }),
            ),

          branches:
            branches.rows.map(
              (row) => ({
                id: Number(row.id),

                companyId:
                  Number(
                    row.company_id,
                  ),

                companyName:
                  row.company_name,

                branchCode:
                  row.branch_code,

                name:
                  row.branch_name,

                location:
                  row.location,

                employeeCount: null,
              }),
            ),

          limitation:
            "Employee branch relationships are not exposed by the current employee API, so employee counts by branch remain unavailable.",
        },
      });
    } catch (error) {
      console.error(
        "Company report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load company and branch report",
      });
    }
  },
);

/* =========================================================
   RECRUITMENT REPORT

   Super/Company/HR/Recruiter -> company-scoped
   Client User                -> company + client-scoped
========================================================= */

router.get(
  "/recruitment",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.RECRUITER,
          ROLE.CLIENT_USER,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          [
            "date",
            "departmentId",
          ],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const positionValues = [];

      const positionConditions =
        dateConditions(
          filters,
          "jp.created_at",
          positionValues,
        );

      addRecruitmentScope(
        req,
        positionValues,
        positionConditions,
        "jp",
      );

      if (filters.departmentId) {
        positionValues.push(
          filters.departmentId,
        );

        positionConditions.push(
          `jp.department_id = $${positionValues.length}`,
        );
      }

      const candidateValues = [];

      const candidateConditions =
        dateConditions(
          filters,
          "c.created_at",
          candidateValues,
        );

      addRecruitmentScope(
        req,
        candidateValues,
        candidateConditions,
        "jp",
      );

      if (filters.departmentId) {
        candidateValues.push(
          filters.departmentId,
        );

        candidateConditions.push(
          `jp.department_id = $${candidateValues.length}`,
        );
      }

      const [
        positions,
        candidates,
        stages,
      ] = await Promise.all([
        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE jp.status = 'OPEN'
                ) AS open,

              COUNT(*)
                FILTER (
                  WHERE jp.status = 'CLOSED'
                ) AS closed

            FROM job_positions jp

            ${withWhere(
              positionConditions,
            )};
          `,
          positionValues,
        ),

        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE c.stage = 'HIRED'
                ) AS hired,

              COUNT(*)
                FILTER (
                  WHERE c.stage = 'REJECTED'
                ) AS rejected

            FROM candidates c

            LEFT JOIN job_positions jp
              ON jp.id = c.job_position_id
              AND jp.company_id = c.company_id

            ${withWhere(
              candidateConditions,
            )};
          `,
          candidateValues,
        ),

        pool.query(
          `
            SELECT
              c.stage,
              COUNT(*) AS total

            FROM candidates c

            LEFT JOIN job_positions jp
              ON jp.id = c.job_position_id
              AND jp.company_id = c.company_id

            ${withWhere(
              candidateConditions,
            )}

            GROUP BY c.stage

            ORDER BY c.stage;
          `,
          candidateValues,
        ),
      ]);

      res.json({
        success: true,

        data: {
          positions: {
            total:
              Number(
                positions.rows[0].total,
              ),

            open:
              Number(
                positions.rows[0].open,
              ),

            closed:
              Number(
                positions.rows[0].closed,
              ),
          },

          candidates: {
            total:
              Number(
                candidates.rows[0].total,
              ),

            hired:
              Number(
                candidates.rows[0].hired,
              ),

            rejected:
              Number(
                candidates.rows[0].rejected,
              ),

            byStage:
              stages.rows.map(
                (row) => ({
                  stage: row.stage,
                  total:
                    Number(
                      row.total,
                    ),
                }),
              ),
          },
        },
      });
    } catch (error) {
      console.error(
        "Recruitment report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load recruitment report",
      });
    }
  },
);

/* =========================================================
   ONBOARDING REPORT

   Company/HR/Super Admin -> company-wide
   Manager                -> direct reports
   Employee               -> self
========================================================= */

router.get(
  "/onboarding",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.MANAGER,
          ROLE.EMPLOYEE,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          [
            "date",
            "departmentId",
          ],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const values = [];

      const conditions =
        dateConditions(
          filters,
          "o.expected_joining_date",
          values,
        );

      addTenantScope(
        req,
        values,
        conditions,
        "o.company_id",
      );

      if (filters.departmentId) {
        values.push(
          filters.departmentId,
        );

        conditions.push(
          `o.department_id = $${values.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        values,
        conditions,
        "e",
      );

      const result =
        await pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'INITIATED'
                ) AS initiated,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'DOCUMENTS_PENDING'
                ) AS documents_pending,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'VERIFICATION_PENDING'
                ) AS verification_pending,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'READY_TO_JOIN'
                ) AS ready_to_join,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'JOINED'
                ) AS joined,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'IN_PROGRESS'
                ) AS in_progress,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'COMPLETED'
                ) AS completed,

              COUNT(*)
                FILTER (
                  WHERE o.status = 'CANCELLED'
                ) AS cancelled

            FROM onboardings o

            LEFT JOIN employees e
              ON e.id = o.employee_id
              AND e.company_id = o.company_id

            ${withWhere(
              conditions,
            )};
          `,
          values,
        );

      const row = result.rows[0];

      res.json({
        success: true,

        data: {
          total:
            Number(row.total),

          initiated:
            Number(row.initiated),

          documentsPending:
            Number(
              row.documents_pending,
            ),

          verificationPending:
            Number(
              row.verification_pending,
            ),

          readyToJoin:
            Number(
              row.ready_to_join,
            ),

          joined:
            Number(row.joined),

          inProgress:
            Number(
              row.in_progress,
            ),

          completed:
            Number(
              row.completed,
            ),

          cancelled:
            Number(
              row.cancelled,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Onboarding report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load onboarding report",
      });
    }
  },
);

/* =========================================================
   PAYROLL REPORT

   Super/Company/HR/Payroll Admin -> company-scoped
========================================================= */

router.get(
  "/payroll",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.PAYROLL_ADMIN,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          ["date"],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const values = [];

      const conditions =
        dateConditions(
          filters,
          "pr.payroll_month",
          values,
        );

      addTenantScope(
        req,
        values,
        conditions,
        "pr.company_id",
      );

      const whereClause =
        withWhere(conditions);

      const [
        summary,
        months,
        approvals,
      ] = await Promise.all([
        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE pr.status = 'PENDING'
                ) AS pending,

              COUNT(*)
                FILTER (
                  WHERE pr.status = 'PROCESSING'
                ) AS processing,

              COUNT(*)
                FILTER (
                  WHERE pr.status = 'COMPLETED'
                ) AS completed

            FROM payroll_runs pr

            ${whereClause};
          `,
          values,
        ),

        pool.query(
          `
            SELECT
              pr.payroll_month,
              COUNT(*) AS total

            FROM payroll_runs pr

            ${whereClause}

            GROUP BY pr.payroll_month

            ORDER BY pr.payroll_month;
          `,
          values,
        ),

        pool.query(
          `
            SELECT
              COALESCE(
                SUM(pr.pending_approvals),
                0
              ) AS pending_approvals

            FROM payroll_runs pr

            ${whereClause};
          `,
          values,
        ),
      ]);

      const summaryRow =
        summary.rows[0];

      const approvalRow =
        approvals.rows[0];

      res.json({
        success: true,

        data: {
          total:
            Number(summaryRow.total),

          pending:
            Number(summaryRow.pending),

          processing:
            Number(
              summaryRow.processing,
            ),

          completed:
            Number(
              summaryRow.completed,
            ),

          pendingApprovals:
            Number(
              approvalRow.pending_approvals,
            ),

          byMonth:
            months.rows.map(
              (row) => ({
                month:
                  formatDateOnly(
                    row.payroll_month,
                  ),

                total:
                  Number(row.total),
              }),
            ),
        },
      });
    } catch (error) {
      console.error(
        "Payroll report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load payroll report",
      });
    }
  },
);
/* =========================================================
   PERFORMANCE REPORT

   Company/HR/Super Admin -> company-wide
   Manager                -> direct reports
   Employee               -> self
========================================================= */

router.get(
  "/performance",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.MANAGER,
          ROLE.EMPLOYEE,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          [
            "date",
            "departmentId",
          ],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const values = [];

      const conditions =
        dateConditions(
          filters,
          {
            start:
              "pr.review_period_start",

            end:
              "pr.review_period_end",
          },
          values,
          true,
        );

      addTenantScope(
        req,
        values,
        conditions,
        "e.company_id",
      );

      if (filters.departmentId) {
        values.push(
          filters.departmentId,
        );

        conditions.push(
          `e.department_id = $${values.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        values,
        conditions,
        "e",
      );

      const whereClause =
        withWhere(conditions);

      const departmentValues = [];

      const departmentConditions =
        dateConditions(
          filters,
          {
            start:
              "pr.review_period_start",

            end:
              "pr.review_period_end",
          },
          departmentValues,
          true,
        );

      addTenantScope(
        req,
        departmentValues,
        departmentConditions,
        "d.company_id",
      );

      if (filters.departmentId) {
        departmentValues.push(
          filters.departmentId,
        );

        departmentConditions.push(
          `d.id = $${departmentValues.length}`,
        );
      }

      addEmployeeVisibilityScope(
        req,
        departmentValues,
        departmentConditions,
        "e",
      );

      const [
        summary,
        ratings,
        departments,
      ] = await Promise.all([
        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE pr.status = 'DRAFT'
                ) AS draft,

              COUNT(*)
                FILTER (
                  WHERE pr.status = 'IN_REVIEW'
                ) AS in_review,

              COUNT(*)
                FILTER (
                  WHERE pr.status = 'COMPLETED'
                ) AS completed,

              COALESCE(
                AVG(pr.rating),
                0
              ) AS average_rating

            FROM performance_reviews pr

            INNER JOIN employees e
              ON e.id = pr.employee_id

            ${whereClause};
          `,
          values,
        ),

        pool.query(
          `
            SELECT
              pr.rating,
              COUNT(*) AS total

            FROM performance_reviews pr

            INNER JOIN employees e
              ON e.id = pr.employee_id

            ${whereClause}
            ${
              whereClause
                ? " AND"
                : " WHERE"
            }
            pr.rating IS NOT NULL

            GROUP BY pr.rating

            ORDER BY pr.rating;
          `,
          values,
        ),

        pool.query(
          `
            SELECT
              d.id,
              d.name,
              COUNT(pr.id) AS review_count

            FROM departments d

            LEFT JOIN employees e
              ON e.department_id = d.id
              AND e.company_id = d.company_id

            LEFT JOIN performance_reviews pr
              ON pr.employee_id = e.id

            ${withWhere(
              departmentConditions,
            )}

            GROUP BY
              d.id,
              d.name

            ORDER BY d.name;
          `,
          departmentValues,
        ),
      ]);

      const row =
        summary.rows[0];

      res.json({
        success: true,

        data: {
          total:
            Number(row.total),

          draft:
            Number(row.draft),

          inReview:
            Number(row.in_review),

          completed:
            Number(row.completed),

          averageRating:
            Number(
              row.average_rating,
            ),

          ratingDistribution:
            ratings.rows.map(
              (item) => ({
                rating:
                  Number(
                    item.rating,
                  ),

                total:
                  Number(
                    item.total,
                  ),
              }),
            ),

          byDepartment:
            departments.rows.map(
              (item) => ({
                id:
                  Number(item.id),

                name:
                  item.name,

                total:
                  Number(
                    item.review_count,
                  ),
              }),
            ),
        },
      });
    } catch (error) {
      console.error(
        "Performance report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load performance report",
      });
    }
  },
);

/* =========================================================
   TRAINING REPORT

   Company/HR/Super Admin -> company-wide
   Manager                -> company programs + team enrollments
   Employee               -> company programs + own enrollments
========================================================= */

router.get(
  "/training",
  async (req, res) => {
    if (
      !assertReportAccess(
        req,
        res,
        [
          ROLE.SUPER_ADMIN,
          ROLE.COMPANY_ADMIN,
          ROLE.HR_ADMIN,
          ROLE.MANAGER,
          ROLE.EMPLOYEE,
        ],
      )
    ) {
      return;
    }

    try {
      const parsed =
        parseFilters(
          req.query,
          ["date"],
        );

      if (parsed.error) {
        return res.status(400).json({
          success: false,
          message: parsed.error,
        });
      }

      const { filters } = parsed;

      const programValues = [];

      const programConditions =
        dateConditions(
          filters,
          "tp.created_at",
          programValues,
        );

      addTenantScope(
        req,
        programValues,
        programConditions,
        "tp.company_id",
      );

      const enrollmentValues = [];

      const enrollmentConditions =
        dateConditions(
          filters,
          "te.created_at",
          enrollmentValues,
        );

      addTenantScope(
        req,
        enrollmentValues,
        enrollmentConditions,
        "te.company_id",
      );

      addEmployeeVisibilityScope(
        req,
        enrollmentValues,
        enrollmentConditions,
        "e",
      );

      const [
        programs,
        enrollments,
        categories,
        completion,
        assessments,
      ] = await Promise.all([
        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE tp.status = 'ACTIVE'
                ) AS active,

              COUNT(*)
                FILTER (
                  WHERE tp.status = 'INACTIVE'
                ) AS inactive

            FROM training_programs tp

            ${withWhere(
              programConditions,
            )};
          `,
          programValues,
        ),

        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE te.status = 'COMPLETED'
                ) AS completed

            FROM training_enrollments te

            INNER JOIN training_programs tp
              ON tp.id =
                te.training_program_id
              AND tp.company_id =
                te.company_id

            INNER JOIN employees e
              ON e.id =
                te.employee_id
              AND e.company_id =
                te.company_id

            ${withWhere(
              enrollmentConditions,
            )};
          `,
          enrollmentValues,
        ),

        pool.query(
          `
            SELECT
              tp.category,
              COUNT(*) AS total

            FROM training_programs tp

            ${withWhere(
              programConditions,
            )}

            GROUP BY tp.category

            ORDER BY tp.category;
          `,
          programValues,
        ),

        pool.query(
          `
            SELECT
              COUNT(*) AS total,

              COUNT(*)
                FILTER (
                  WHERE te.status = 'COMPLETED'
                ) AS completed

            FROM training_enrollments te

            INNER JOIN training_programs tp
              ON tp.id =
                te.training_program_id
              AND tp.company_id =
                te.company_id

            INNER JOIN employees e
              ON e.id =
                te.employee_id
              AND e.company_id =
                te.company_id

            ${withWhere(
              enrollmentConditions,
            )};
          `,
          enrollmentValues,
        ),

        pool.query(
          `
            SELECT
              COUNT(*)
                FILTER (
                  WHERE te.assessment_result = 'PASS'
                ) AS pass,

              COUNT(*)
                FILTER (
                  WHERE te.assessment_result = 'FAIL'
                ) AS fail

            FROM training_enrollments te

            INNER JOIN training_programs tp
              ON tp.id =
                te.training_program_id
              AND tp.company_id =
                te.company_id

            INNER JOIN employees e
              ON e.id =
                te.employee_id
              AND e.company_id =
                te.company_id

            ${withWhere(
              enrollmentConditions,
            )};
          `,
          enrollmentValues,
        ),
      ]);

      const programRow =
        programs.rows[0];

      const enrollmentRow =
        enrollments.rows[0];

      res.json({
        success: true,

        data: {
          programs: {
            total:
              Number(
                programRow.total,
              ),

            active:
              Number(
                programRow.active,
              ),

            inactive:
              Number(
                programRow.inactive,
              ),

            byCategory:
              categories.rows.map(
                (item) => ({
                  category:
                    item.category,

                  total:
                    Number(
                      item.total,
                    ),
                }),
              ),
          },

          enrollments: {
            total:
              Number(
                enrollmentRow.total,
              ),

            completed:
              Number(
                enrollmentRow.completed,
              ),

            completionRate:
              Number(
                enrollmentRow.total,
              )
                ? Math.round(
                    (
                      Number(
                        enrollmentRow.completed,
                      ) /
                      Number(
                        enrollmentRow.total,
                      )
                    ) *
                      100,
                  )
                : 0,
          },

          assessmentResults: {
            pass:
              Number(
                assessments.rows[0]
                  .pass,
              ),

            fail:
              Number(
                assessments.rows[0]
                  .fail,
              ),
          },
        },
      });
    } catch (error) {
      console.error(
        "Training report error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load training report",
      });
    }
  },
);

export default router;