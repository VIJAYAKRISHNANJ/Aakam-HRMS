import express from "express";
import pool from "../db.js";

const router = express.Router();

// Payroll run management remains company-scoped. Salary endpoints below
// additionally support own-only payroll visibility for employee users.

const PAYROLL_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
];

const SALARY_STATUSES = [
  "ACTIVE",
  "INACTIVE",
];

const isValidId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidPayrollMonth = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value.endsWith("-01")
  );
};

const formatPayrollMonth = (value) => {
  if (!(value instanceof Date)) return value;

  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const mapPayrollRun = (run) => ({
  id: Number(run.id),
  payrollMonth: formatPayrollMonth(
    run.payroll_month,
  ),
  status: run.status,
  pendingApprovals: Number(
    run.pending_approvals,
  ),
  createdAt: run.created_at,
});

const formatDate = (value) => {
  if (!(value instanceof Date)) return value;

  return value.toISOString().slice(0, 10);
};

const mapSalary = (salary) => ({
  id: Number(salary.id),
  employeeId: Number(salary.employee_id),
  employeeCode: salary.employee_code,
  employeeName: [salary.first_name, salary.last_name]
    .filter(Boolean)
    .join(" "),
  companyId: Number(salary.company_id),
  annualCtc: Number(salary.annual_ctc),
  monthlyGross: Number(salary.monthly_gross),
  basicSalary: Number(salary.basic_salary),
  hra: Number(salary.hra),
  otherAllowances: Number(salary.other_allowances),
  totalDeductions: Number(salary.total_deductions),
  netSalary: Number(salary.net_salary),
  effectiveFrom: formatDate(salary.effective_from),
  effectiveTo: formatDate(salary.effective_to),
  status: salary.status,
  revisionReason: salary.revision_reason,
  remarks: salary.remarks,
  createdAt: salary.created_at,
  updatedAt: salary.updated_at,
});

const isValidDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const parseMoney = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return null;
  }

  return Math.round(number * 100) / 100;
};

const validateSalaryFields = (
  {
    annualCtc,
    monthlyGross,
    basicSalary,
    hra,
    otherAllowances,
    totalDeductions,
    netSalary,
    effectiveFrom,
    effectiveTo,
    status,
  },
  partial = false,
) => {
  const moneyFields = [
    ["annualCtc", annualCtc],
    ["monthlyGross", monthlyGross],
    ["basicSalary", basicSalary],
    ["hra", hra],
    ["otherAllowances", otherAllowances],
    ["totalDeductions", totalDeductions],
    ["netSalary", netSalary],
  ];

  for (const [name, value] of moneyFields) {
    if (partial && value === undefined) continue;

    if (parseMoney(value) === null) {
      return `${name} must be a non-negative number`;
    }
  }

  if (
    (!partial || effectiveFrom !== undefined) &&
    !isValidDate(effectiveFrom)
  ) {
    return "Effective from must be a valid date in YYYY-MM-DD format";
  }

  if (
    effectiveTo !== undefined &&
    effectiveTo !== null &&
    effectiveTo !== "" &&
    !isValidDate(effectiveTo)
  ) {
    return "Effective to must be a valid date in YYYY-MM-DD format";
  }

  if (
    effectiveFrom &&
    effectiveTo &&
    effectiveTo < effectiveFrom
  ) {
    return "Effective to cannot be before effective from";
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !SALARY_STATUSES.includes(status.toUpperCase())
    )
  ) {
    return "Invalid salary status";
  }

  if (
    !partial &&
    parseMoney(basicSalary) !== null &&
    parseMoney(hra) !== null &&
    parseMoney(otherAllowances) !== null &&
    parseMoney(monthlyGross) !== null &&
    parseMoney(totalDeductions) !== null &&
    parseMoney(netSalary) !== null
  ) {
    const gross = parseMoney(monthlyGross);

    const components =
      parseMoney(basicSalary) +
      parseMoney(hra) +
      parseMoney(otherAllowances);

    const deductions = parseMoney(totalDeductions);
    const net = parseMoney(netSalary);

    if (components > gross) {
      return "Basic salary, HRA and other allowances cannot exceed monthly gross";
    }

    if (
      Math.abs(
        (gross - deductions) - net,
      ) > 0.01
    ) {
      return "Net salary must equal monthly gross minus total deductions";
    }
  }

  return null;
};

const salarySelect = `
  SELECT
    es.id,
    es.employee_id,
    es.company_id,
    es.annual_ctc,
    es.monthly_gross,
    es.basic_salary,
    es.hra,
    es.other_allowances,
    es.total_deductions,
    es.net_salary,
    es.effective_from,
    es.effective_to,
    es.status,
    es.revision_reason,
    es.remarks,
    es.created_at,
    es.updated_at,
    e.employee_code,
    e.first_name,
    e.last_name
  FROM employee_salaries es
  INNER JOIN employees e
    ON e.id = es.employee_id
   AND e.company_id = es.company_id
`;


/* ============================================================
   GET ALL PAYROLL RUNS
   GET /api/payroll
============================================================ */

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        payroll_month,
        status,
        pending_approvals,
        created_at
      FROM payroll_runs
      WHERE ($1::boolean OR company_id = $2)
      ORDER BY payroll_month DESC, id DESC;
    `, [
      req.user.roles.includes("SUPER_ADMINISTRATOR"),
      req.user.requestedCompanyId ?? null,
    ]);

    res.json({
      success: true,
      data: result.rows.map(mapPayrollRun),
      total: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Payroll list error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to load payroll runs",
    });
  }
});


/* ============================================================
   EMPLOYEE SALARIES

   These routes are intentionally placed before /:id so that
   /salaries is not interpreted as a payroll run ID.
============================================================ */


/* ============================================================
   GET ALL / VISIBLE EMPLOYEE SALARIES
   GET /api/payroll/salaries
============================================================ */

router.get("/salaries", async (req, res) => {
  try {
    const isPlatform =
      req.user.roles.includes("SUPER_ADMINISTRATOR");

    if (
      req.authorization?.ownOnly &&
      !req.user.employee_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Employee payroll scope is not configured",
      });
    }

    const result = await pool.query(
      `
        ${salarySelect}
        WHERE
          (
            $1::boolean
            OR es.company_id = $2
          )
          AND (
            NOT $3::boolean
            OR es.employee_id = $4
          )
        ORDER BY
          es.status = 'ACTIVE' DESC,
          es.effective_from DESC,
          es.id DESC;
      `,
      [
        isPlatform,
        req.user.requestedCompanyId ?? null,
        Boolean(req.authorization?.ownOnly),
        req.user.employee_id ?? null,
      ],
    );

    res.json({
      success: true,
      data: result.rows.map(mapSalary),
      total: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Salary list error:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to load employee salaries",
    });
  }
});


/* ============================================================
   GET CURRENT SALARY FOR EMPLOYEE
   GET /api/payroll/salaries/:employeeId
============================================================ */

router.get(
  "/salaries/:employeeId",
  async (req, res) => {
    try {
      if (!isValidId(req.params.employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      if (
        req.authorization?.ownOnly &&
        Number(req.params.employeeId) !==
          Number(req.user.employee_id)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only access your own salary",
        });
      }

      const isPlatform =
        req.user.roles.includes("SUPER_ADMINISTRATOR");

      const result = await pool.query(
        `
          ${salarySelect}
          WHERE
            es.employee_id = $1
            AND (
              $2::boolean
              OR es.company_id = $3
            )
          ORDER BY
            CASE
              WHEN es.status = 'ACTIVE'
              THEN 0
              ELSE 1
            END,
            es.effective_from DESC,
            es.id DESC
          LIMIT 1;
        `,
        [
          req.params.employeeId,
          isPlatform,
          req.user.requestedCompanyId ?? null,
        ],
      );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message: "Employee salary not found",
        });
      }

      res.json({
        success: true,
        data: mapSalary(result.rows[0]),
      });
    } catch (error) {
      console.error(
        "Employee salary detail error:",
        error,
      );

      res.status(500).json({
        success: false,
        message: "Failed to load employee salary",
      });
    }
  },
);


/* ============================================================
   GET SALARY HISTORY
   GET /api/payroll/salaries/:employeeId/history
============================================================ */

router.get(
  "/salaries/:employeeId/history",
  async (req, res) => {
    try {
      if (!isValidId(req.params.employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      if (
        req.authorization?.ownOnly &&
        Number(req.params.employeeId) !==
          Number(req.user.employee_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only access your own salary history",
        });
      }

      const isPlatform =
        req.user.roles.includes("SUPER_ADMINISTRATOR");

      const result = await pool.query(
        `
          ${salarySelect}
          WHERE
            es.employee_id = $1
            AND (
              $2::boolean
              OR es.company_id = $3
            )
          ORDER BY
            es.effective_from DESC,
            es.id DESC;
        `,
        [
          req.params.employeeId,
          isPlatform,
          req.user.requestedCompanyId ?? null,
        ],
      );

      res.json({
        success: true,
        data: result.rows.map(mapSalary),
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        "Salary history error:",
        error,
      );

      res.status(500).json({
        success: false,
        message: "Failed to load salary history",
      });
    }
  },
);


/* ============================================================
   CREATE EMPLOYEE SALARY
   POST /api/payroll/salaries
============================================================ */

router.post(
  "/salaries",
  async (req, res) => {
    if (req.authorization?.ownOnly) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to create salary records",
      });
    }

    const client = await pool.connect();

    try {
      const {
        employeeId,
        annualCtc,
        monthlyGross,
        basicSalary,
        hra,
        otherAllowances,
        totalDeductions,
        netSalary,
        effectiveFrom,
        effectiveTo = null,
        status = "ACTIVE",
        revisionReason = null,
        remarks = null,
      } = req.body;

      if (!isValidId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const normalizedStatus =
        typeof status === "string"
          ? status.toUpperCase()
          : status;

      const validationError =
        validateSalaryFields({
          annualCtc,
          monthlyGross,
          basicSalary,
          hra,
          otherAllowances,
          totalDeductions,
          netSalary,
          effectiveFrom,
          effectiveTo,
          status: normalizedStatus,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      if (
        revisionReason !== null &&
        revisionReason !== undefined &&
        typeof revisionReason !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Revision reason must be text",
        });
      }

      if (
        remarks !== null &&
        remarks !== undefined &&
        typeof remarks !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Remarks must be text",
        });
      }

      const isPlatform =
        req.user.roles.includes("SUPER_ADMINISTRATOR");

      const companyId =
        req.user.requestedCompanyId ?? null;

      if (!isPlatform && !companyId) {
        return res.status(403).json({
          success: false,
          message: "Company context is required",
        });
      }

      if (isPlatform && !companyId) {
        return res.status(400).json({
          success: false,
          message:
            "A company must be selected for salary management",
        });
      }

      await client.query("BEGIN");

      const employeeResult =
        await client.query(
          `
            SELECT
              id,
              company_id,
              employee_code,
              first_name,
              last_name
            FROM employees
            WHERE id = $1
              AND (
                $2::boolean
                OR company_id = $3
              )
            FOR UPDATE;
          `,
          [
            employeeId,
            isPlatform,
            companyId,
          ],
        );

      if (!employeeResult.rows.length) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message:
            "Employee not found in the selected company",
        });
      }

      const employee =
        employeeResult.rows[0];

      const activeResult =
        await client.query(
          `
            SELECT
              id,
              effective_from
            FROM employee_salaries
            WHERE employee_id = $1
              AND company_id = $2
              AND status = 'ACTIVE'
            ORDER BY
              effective_from DESC,
              id DESC
            LIMIT 1
            FOR UPDATE;
          `,
          [
            employeeId,
            employee.company_id,
          ],
        );

      if (
        normalizedStatus === "ACTIVE" &&
        activeResult.rows.length
      ) {
        const activeSalary =
          activeResult.rows[0];

        if (
          effectiveFrom <=
          formatDate(
            activeSalary.effective_from,
          )
        ) {
          await client.query("ROLLBACK");

          return res.status(409).json({
            success: false,
            message:
              "New salary effective date must be after the current active salary effective date",
          });
        }

        await client.query(
          `
            UPDATE employee_salaries
            SET
              status = 'INACTIVE',
              effective_to =
                (
                  $1::date -
                  INTERVAL '1 day'
                )::date
            WHERE id = $2;
          `,
          [
            effectiveFrom,
            activeSalary.id,
          ],
        );
      }

      const result =
        await client.query(
          `
            INSERT INTO employee_salaries (
              employee_id,
              company_id,
              annual_ctc,
              monthly_gross,
              basic_salary,
              hra,
              other_allowances,
              total_deductions,
              net_salary,
              effective_from,
              effective_to,
              status,
              revision_reason,
              remarks
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              $13,
              $14
            )
            RETURNING
              id,
              employee_id,
              company_id,
              annual_ctc,
              monthly_gross,
              basic_salary,
              hra,
              other_allowances,
              total_deductions,
              net_salary,
              effective_from,
              effective_to,
              status,
              revision_reason,
              remarks,
              created_at,
              updated_at;
          `,
          [
            employeeId,
            employee.company_id,
            parseMoney(annualCtc),
            parseMoney(monthlyGross),
            parseMoney(basicSalary),
            parseMoney(hra),
            parseMoney(otherAllowances),
            parseMoney(totalDeductions),
            parseMoney(netSalary),
            effectiveFrom,
            effectiveTo || null,
            normalizedStatus,
            revisionReason || null,
            remarks || null,
          ],
        );

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message:
          "Employee salary created successfully",
        data: mapSalary({
          ...result.rows[0],
          employee_code:
            employee.employee_code,
          first_name:
            employee.first_name,
          last_name:
            employee.last_name,
        }),
      });
    } catch (error) {
      await client
        .query("ROLLBACK")
        .catch(() => {});

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A salary record already exists for this employee and effective date",
        });
      }

      console.error(
        "Create employee salary error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create employee salary",
      });
    } finally {
      client.release();
    }
  },
);


/* ============================================================
   UPDATE EMPLOYEE SALARY
   PUT /api/payroll/salaries/:id
============================================================ */

router.put(
  "/salaries/:id",
  async (req, res) => {
    if (req.authorization?.ownOnly) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update salary records",
      });
    }

    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary ID",
        });
      }

      const existingResult =
        await pool.query(
          `
            ${salarySelect}
            WHERE
              es.id = $1
              AND (
                $2::boolean
                OR es.company_id = $3
              )
              AND (
                NOT $4::boolean
                OR es.employee_id = $5
              )
            LIMIT 1;
          `,
          [
            req.params.id,
            req.user.roles.includes(
              "SUPER_ADMINISTRATOR",
            ),
            req.user.requestedCompanyId ?? null,
            Boolean(
              req.authorization?.ownOnly,
            ),
            req.user.employee_id ?? null,
          ],
        );

      if (!existingResult.rows.length) {
        return res.status(404).json({
          success: false,
          message: "Salary record not found",
        });
      }

      const existing =
        existingResult.rows[0];

      const {
        annualCtc,
        monthlyGross,
        basicSalary,
        hra,
        otherAllowances,
        totalDeductions,
        netSalary,
        effectiveFrom,
        effectiveTo,
        status,
        revisionReason,
        remarks,
      } = req.body;

      const normalizedStatus =
        typeof status === "string"
          ? status.toUpperCase()
          : status;

      const validationError =
        validateSalaryFields(
          {
            annualCtc,
            monthlyGross,
            basicSalary,
            hra,
            otherAllowances,
            totalDeductions,
            netSalary,
            effectiveFrom,
            effectiveTo,
            status: normalizedStatus,
          },
          true,
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const updates = [];
      const values = [];

      const addUpdate = (
        column,
        value,
      ) => {
        values.push(value);

        updates.push(
          `${column} = $${values.length}`,
        );
      };

      if (annualCtc !== undefined) {
        addUpdate(
          "annual_ctc",
          parseMoney(annualCtc),
        );
      }

      if (monthlyGross !== undefined) {
        addUpdate(
          "monthly_gross",
          parseMoney(monthlyGross),
        );
      }

      if (basicSalary !== undefined) {
        addUpdate(
          "basic_salary",
          parseMoney(basicSalary),
        );
      }

      if (hra !== undefined) {
        addUpdate(
          "hra",
          parseMoney(hra),
        );
      }

      if (
        otherAllowances !== undefined
      ) {
        addUpdate(
          "other_allowances",
          parseMoney(
            otherAllowances,
          ),
        );
      }

      if (
        totalDeductions !== undefined
      ) {
        addUpdate(
          "total_deductions",
          parseMoney(
            totalDeductions,
          ),
        );
      }

      if (netSalary !== undefined) {
        addUpdate(
          "net_salary",
          parseMoney(netSalary),
        );
      }

      if (
        effectiveFrom !== undefined
      ) {
        addUpdate(
          "effective_from",
          effectiveFrom,
        );
      }

      if (
        effectiveTo !== undefined
      ) {
        addUpdate(
          "effective_to",
          effectiveTo || null,
        );
      }

      if (
        normalizedStatus !== undefined
      ) {
        addUpdate(
          "status",
          normalizedStatus,
        );
      }

      if (
        revisionReason !== undefined
      ) {
        addUpdate(
          "revision_reason",
          revisionReason || null,
        );
      }

      if (remarks !== undefined) {
        addUpdate(
          "remarks",
          remarks || null,
        );
      }

      if (
        revisionReason !== undefined &&
        revisionReason !== null &&
        typeof revisionReason !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Revision reason must be text",
        });
      }

      if (
        remarks !== undefined &&
        remarks !== null &&
        typeof remarks !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Remarks must be text",
        });
      }

      if (!updates.length) {
        return res.status(400).json({
          success: false,
          message:
            "At least one field is required",
        });
      }

      const nextMonthlyGross =
        monthlyGross !== undefined
          ? parseMoney(monthlyGross)
          : Number(
              existing.monthly_gross,
            );

      const nextBasic =
        basicSalary !== undefined
          ? parseMoney(basicSalary)
          : Number(
              existing.basic_salary,
            );

      const nextHra =
        hra !== undefined
          ? parseMoney(hra)
          : Number(existing.hra);

      const nextAllowances =
        otherAllowances !== undefined
          ? parseMoney(
              otherAllowances,
            )
          : Number(
              existing.other_allowances,
            );

      const nextDeductions =
        totalDeductions !== undefined
          ? parseMoney(
              totalDeductions,
            )
          : Number(
              existing.total_deductions,
            );

      const nextNet =
        netSalary !== undefined
          ? parseMoney(netSalary)
          : Number(
              existing.net_salary,
            );

      if (
        nextBasic +
          nextHra +
          nextAllowances >
        nextMonthlyGross
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Basic salary, HRA and other allowances cannot exceed monthly gross",
        });
      }

      if (
        Math.abs(
          nextMonthlyGross -
            nextDeductions -
            nextNet,
        ) > 0.01
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Net salary must equal monthly gross minus total deductions",
        });
      }

      const nextEffectiveFrom =
        effectiveFrom !== undefined
          ? effectiveFrom
          : formatDate(
              existing.effective_from,
            );

      const nextEffectiveTo =
        effectiveTo !== undefined
          ? effectiveTo || null
          : formatDate(
              existing.effective_to,
            );

      if (
        nextEffectiveTo &&
        nextEffectiveTo <
          nextEffectiveFrom
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Effective to cannot be before effective from",
        });
      }

      values.push(
        req.params.id,
        req.user.roles.includes(
          "SUPER_ADMINISTRATOR",
        ),
        req.user.requestedCompanyId ??
          null,
        Boolean(
          req.authorization?.ownOnly,
        ),
        req.user.employee_id ?? null,
      );

      const idIndex =
        values.length - 4;

      const platformIndex =
        values.length - 3;

      const companyIndex =
        values.length - 2;

      const ownOnlyIndex =
        values.length - 1;

      const employeeIndex =
        values.length;

      const result =
        await pool.query(
          `
            UPDATE employee_salaries
            SET
              ${updates.join(", ")},
              updated_at = CURRENT_TIMESTAMP
            WHERE
              id = $${idIndex}
              AND (
                $${platformIndex}::boolean
                OR company_id =
                  $${companyIndex}
              )
              AND (
                NOT $${ownOnlyIndex}::boolean
                OR employee_id =
                  $${employeeIndex}
              )
            RETURNING
              id,
              employee_id,
              company_id,
              annual_ctc,
              monthly_gross,
              basic_salary,
              hra,
              other_allowances,
              total_deductions,
              net_salary,
              effective_from,
              effective_to,
              status,
              revision_reason,
              remarks,
              created_at,
              updated_at;
          `,
          values,
        );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Salary record not found",
        });
      }

      res.json({
        success: true,
        message:
          "Employee salary updated successfully",
        data: mapSalary({
          ...result.rows[0],
          employee_code:
            existing.employee_code,
          first_name:
            existing.first_name,
          last_name:
            existing.last_name,
        }),
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A salary record already exists for this employee and effective date",
        });
      }

      console.error(
        "Update employee salary error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update employee salary",
      });
    }
  },
);


/* ============================================================
   DELETE EMPLOYEE SALARY
   DELETE /api/payroll/salaries/:id
============================================================ */

router.delete(
  "/salaries/:id",
  async (req, res) => {
    if (req.authorization?.ownOnly) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete salary records",
      });
    }

    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary ID",
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM employee_salaries es
            WHERE
              es.id = $1
              AND (
                $2::boolean
                OR es.company_id = $3
              )
              AND (
                NOT $4::boolean
                OR es.employee_id = $5
              )
            RETURNING
              es.id,
              es.employee_id,
              es.company_id,
              es.annual_ctc,
              es.monthly_gross,
              es.basic_salary,
              es.hra,
              es.other_allowances,
              es.total_deductions,
              es.net_salary,
              es.effective_from,
              es.effective_to,
              es.status,
              es.revision_reason,
              es.remarks,
              es.created_at,
              es.updated_at;
          `,
          [
            req.params.id,
            req.user.roles.includes(
              "SUPER_ADMINISTRATOR",
            ),
            req.user.requestedCompanyId ??
              null,
            Boolean(
              req.authorization?.ownOnly,
            ),
            req.user.employee_id ?? null,
          ],
        );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Salary record not found",
        });
      }

      res.json({
        success: true,
        message:
          "Employee salary deleted successfully",
        data: mapSalary(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Delete employee salary error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete employee salary",
      });
    }
  },
);


/* ============================================================
   GET SINGLE PAYROLL RUN
   GET /api/payroll/:id
============================================================ */

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll run ID",
      });
    }

    const payrollRun =
      await getPayrollRun(
        req,
        req.params.id,
      );

    if (!payrollRun) {
      return res.status(404).json({
        success: false,
        message: "Payroll run not found",
      });
    }

    res.json({
      success: true,
      data: mapPayrollRun(
        payrollRun,
      ),
    });
  } catch (error) {
    console.error(
      "Payroll profile error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load payroll run",
    });
  }
});


/* ============================================================
   CREATE PAYROLL RUN
   POST /api/payroll
============================================================ */

router.post("/", async (req, res) => {
  try {
    const {
      payrollMonth,
      status = "PENDING",
      pendingApprovals = 0,
    } = req.body;

    const normalizedStatus =
      typeof status === "string"
        ? status.toUpperCase()
        : status;

    const validationError =
      validateFields({
        payrollMonth,
        status: normalizedStatus,
        pendingApprovals,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result = await pool.query(
      `
        INSERT INTO payroll_runs
        (
          payroll_month,
          status,
          pending_approvals,
          company_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
          id,
          payroll_month,
          status,
          pending_approvals,
          created_at;
      `,
      [
        payrollMonth,
        normalizedStatus,
        pendingApprovals,
        req.user.requestedCompanyId,
      ],
    );

    res.status(201).json({
      success: true,
      message:
        "Payroll run created successfully",
      data: mapPayrollRun(
        result.rows[0],
      ),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "A payroll run already exists for this month",
      });
    }

    console.error(
      "Create payroll error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create payroll run",
    });
  }
});


/* ============================================================
   UPDATE PAYROLL RUN
   PUT /api/payroll/:id
============================================================ */

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payroll run ID",
      });
    }

    const existing =
      await getPayrollRun(
        req,
        req.params.id,
      );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Payroll run not found",
      });
    }

    if (
      existing.status === "COMPLETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Completed payroll runs cannot be updated",
      });
    }

    const {
      payrollMonth,
      status,
      pendingApprovals,
    } = req.body;

    const normalizedStatus =
      typeof status === "string"
        ? status.toUpperCase()
        : status;

    const normalizedApprovals =
      pendingApprovals === undefined
        ? pendingApprovals
        : Number(
            pendingApprovals,
          );

    const validationError =
      validateFields(
        {
          payrollMonth,
          status: normalizedStatus,
          pendingApprovals:
            normalizedApprovals,
        },
        true,
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (
      normalizedStatus ===
        "PENDING" &&
      existing.status ===
        "PROCESSING"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A processing payroll run cannot return to pending",
      });
    }

    if (
      normalizedStatus ===
      "COMPLETED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Use the complete endpoint to complete payroll",
      });
    }

    const updates = [];
    const values = [];

    const addUpdate = (
      column,
      value,
    ) => {
      values.push(value);

      updates.push(
        `${column} = $${values.length}`,
      );
    };

    if (
      payrollMonth !== undefined
    ) {
      addUpdate(
        "payroll_month",
        payrollMonth,
      );
    }

    if (
      normalizedStatus !== undefined
    ) {
      addUpdate(
        "status",
        normalizedStatus,
      );
    }

    if (
      normalizedApprovals !==
      undefined
    ) {
      addUpdate(
        "pending_approvals",
        normalizedApprovals,
      );
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field is required",
      });
    }

    values.push(
      req.params.id,
      req.user.roles.includes(
        "SUPER_ADMINISTRATOR",
      ),
      req.user.requestedCompanyId ??
        null,
    );

    const result =
      await pool.query(
        `
          UPDATE payroll_runs
          SET ${updates.join(", ")}
          WHERE
            id = $${values.length - 2}
            AND (
              $${values.length - 1}::boolean
              OR company_id =
                $${values.length}
            )
          RETURNING
            id,
            payroll_month,
            status,
            pending_approvals,
            created_at;
        `,
        values,
      );

    res.json({
      success: true,
      message:
        "Payroll run updated successfully",
      data: mapPayrollRun(
        result.rows[0],
      ),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "A payroll run already exists for this month",
      });
    }

    console.error(
      "Update payroll error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update payroll run",
    });
  }
});


/* ============================================================
   DELETE PAYROLL RUN
   DELETE /api/payroll/:id
============================================================ */

router.delete(
  "/:id",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payroll run ID",
        });
      }

      const existing =
        await getPayrollRun(
          req,
          req.params.id,
        );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Payroll run not found",
        });
      }

      /*
       * Completed payroll runs are normally
       * treated as finalized records.
       *
       * For the current Payroll Run implementation,
       * deletion is still allowed so the existing
       * CRUD workflow remains functional.
       */

      const result =
        await pool.query(
          `
            DELETE FROM payroll_runs
            WHERE
              id = $1
              AND (
                $2::boolean
                OR company_id = $3
              )
            RETURNING
              id,
              payroll_month,
              status,
              pending_approvals,
              created_at;
          `,
          [
            req.params.id,
            req.user.roles.includes(
              "SUPER_ADMINISTRATOR",
            ),
            req.user.requestedCompanyId ??
              null,
          ],
        );

      if (!result.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Payroll run not found",
        });
      }

      res.json({
        success: true,
        message:
          "Payroll run deleted successfully",
        data: mapPayrollRun(
          result.rows[0],
        ),
      });
    } catch (error) {
      /*
       * PostgreSQL foreign-key violation.
       *
       * This can happen later when payroll entries,
       * payslips or other records reference this run.
       */

      if (error.code === "23503") {
        return res.status(409).json({
          success: false,
          message:
            "This payroll run cannot be deleted because related payroll records exist.",
        });
      }

      console.error(
        "Delete payroll error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete payroll run",
      });
    }
  },
);


/* ============================================================
   PROCESS PAYROLL
   POST /api/payroll/:id/process
============================================================ */

router.post(
  "/:id/process",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payroll run ID",
        });
      }

      const result =
        await pool.query(
          `
            UPDATE payroll_runs
            SET status = 'PROCESSING'
            WHERE
              id = $1
              AND status = 'PENDING'
              AND (
                $2::boolean
                OR company_id = $3
              )
            RETURNING
              id,
              payroll_month,
              status,
              pending_approvals,
              created_at;
          `,
          [
            req.params.id,
            req.user.roles.includes(
              "SUPER_ADMINISTRATOR",
            ),
            req.user.requestedCompanyId ??
              null,
          ],
        );

      if (!result.rows.length) {
        const existing =
          await getPayrollRun(
            req,
            req.params.id,
          );

        if (!existing) {
          return res.status(404).json({
            success: false,
            message:
              "Payroll run not found",
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "Only pending payroll runs can be processed",
        });
      }

      res.json({
        success: true,
        message:
          "Payroll processing started",
        data: mapPayrollRun(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Process payroll error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to process payroll run",
      });
    }
  },
);


/* ============================================================
   APPROVE PAYROLL
   POST /api/payroll/:id/approve
============================================================ */

router.post(
  "/:id/approve",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payroll run ID",
        });
      }

      const result =
        await pool.query(
          `
            UPDATE payroll_runs
            SET
              pending_approvals =
                pending_approvals - 1
            WHERE
              id = $1
              AND status = 'PROCESSING'
              AND pending_approvals > 0
              AND (
                $2::boolean
                OR company_id = $3
              )
            RETURNING
              id,
              payroll_month,
              status,
              pending_approvals,
              created_at;
          `,
          [
            req.params.id,
            req.user.roles.includes(
              "SUPER_ADMINISTRATOR",
            ),
            req.user.requestedCompanyId ??
              null,
          ],
        );

      if (!result.rows.length) {
        const existing =
          await getPayrollRun(
            req,
            req.params.id,
          );

        if (!existing) {
          return res.status(404).json({
            success: false,
            message:
              "Payroll run not found",
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "Payroll run has no pending approval or is not processing",
        });
      }

      res.json({
        success: true,
        message:
          "Payroll approval recorded",
        data: mapPayrollRun(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Approve payroll error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to approve payroll run",
      });
    }
  },
);


/* ============================================================
   COMPLETE PAYROLL
   POST /api/payroll/:id/complete
============================================================ */

router.post(
  "/:id/complete",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payroll run ID",
        });
      }

      const result =
        await pool.query(
          `
            UPDATE payroll_runs
            SET status = 'COMPLETED'
            WHERE
              id = $1
              AND status = 'PROCESSING'
              AND pending_approvals = 0
              AND (
                $2::boolean
                OR company_id = $3
              )
            RETURNING
              id,
              payroll_month,
              status,
              pending_approvals,
              created_at;
          `,
          [
            req.params.id,
            req.user.roles.includes(
              "SUPER_ADMINISTRATOR",
            ),
            req.user.requestedCompanyId ??
              null,
          ],
        );

      if (!result.rows.length) {
        const existing =
          await getPayrollRun(
            req,
            req.params.id,
          );

        if (!existing) {
          return res.status(404).json({
            success: false,
            message:
              "Payroll run not found",
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "Payroll must be processing with no pending approvals before completion",
        });
      }

      res.json({
        success: true,
        message:
          "Payroll run completed successfully",
        data: mapPayrollRun(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Complete payroll error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to complete payroll run",
      });
    }
  },
);


/* ============================================================
   GET PAYROLL RUN HELPER
============================================================ */

const getPayrollRun = async (req, id) => {
  const result = await pool.query(
    `
      SELECT
        id,
        payroll_month,
        status,
        pending_approvals,
        created_at
      FROM payroll_runs
      WHERE
        id = $1
        AND (
          $2::boolean
          OR company_id = $3
        )
      LIMIT 1;
    `,
    [
      id,
      req.user.roles.includes(
        "SUPER_ADMINISTRATOR",
      ),
      req.user.requestedCompanyId ??
        null,
    ],
  );

  return result.rows[0];
};


/* ============================================================
   PAYROLL FIELD VALIDATION
============================================================ */

const validateFields = (
  {
    payrollMonth,
    status,
    pendingApprovals,
  },
  partial = false,
) => {
  if (
    (!partial ||
      payrollMonth !== undefined) &&
    !isValidPayrollMonth(
      payrollMonth,
    )
  ) {
    return (
      "Payroll month must be the first day of a valid month in YYYY-MM-DD format"
    );
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !PAYROLL_STATUSES.includes(
        status.toUpperCase(),
      )
    )
  ) {
    return "Invalid payroll status";
  }

  if (
    pendingApprovals !== undefined &&
    (
      !Number.isInteger(
        pendingApprovals,
      ) ||
      pendingApprovals < 0
    )
  ) {
    return (
      "Pending approvals must be a non-negative integer"
    );
  }

  return null;
};


/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default router;