import express from "express";
import pool from "../db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/employees/:id
|--------------------------------------------------------------------------
| Get a single employee profile
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          e.id,
          e.employee_code,
          e.first_name,
          e.last_name,
          e.email,
          e.designation,
          e.department_id,
          d.name AS department_name,
          e.joining_date,
          e.employment_status,
          e.employment_type,
          e.created_at,

          COALESCE(
            (
              SELECT STRING_AGG(
                r.name,
                ', '
                ORDER BY r.name
              )
              FROM users u
              INNER JOIN user_roles ur
                ON ur.user_id = u.id
              INNER JOIN roles r
                ON r.id = ur.role_id
              WHERE u.employee_id = e.id
            ),
            'Not Assigned'
          ) AS system_role

        FROM employees e

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE e.id = $1

        LIMIT 1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const employee = result.rows[0];

    return res.json({
      success: true,

      data: {
        id: Number(employee.id),

        employeeCode:
          employee.employee_code,

        firstName:
          employee.first_name,

        lastName:
          employee.last_name,

        fullName:
          `${employee.first_name} ${
            employee.last_name ?? ""
          }`.trim(),

        email:
          employee.email,

        designation:
          employee.designation ?? "",

        departmentId:
          employee.department_id
            ? Number(employee.department_id)
            : null,

        department:
          employee.department_name ??
          "Unassigned",

        systemRole:
          employee.system_role ??
          "Not Assigned",

        joiningDate:
          employee.joining_date,

        status:
          employee.employment_status,

        employmentType:
          employee.employment_type,

        createdAt:
          employee.created_at,
      },
    });
  } catch (error) {
    console.error(
      "Employee profile error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load employee profile",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/employees
|--------------------------------------------------------------------------
| Get employee directory
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      departmentId = "",
      status = "",
    } = req.query;

    const values = [];
    const conditions = [];

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search.trim()) {
      values.push(
        `%${search.trim()}%`,
      );

      conditions.push(`
        (
          CONCAT(
            e.first_name,
            ' ',
            COALESCE(e.last_name, '')
          ) ILIKE $${values.length}

          OR e.employee_code ILIKE $${values.length}

          OR e.email ILIKE $${values.length}

          OR COALESCE(
            e.designation,
            ''
          ) ILIKE $${values.length}
        )
      `);
    }

    /*
    |--------------------------------------------------------------------------
    | Department
    |--------------------------------------------------------------------------
    */

    if (departmentId) {
      values.push(
        Number(departmentId),
      );

      conditions.push(
        `e.department_id = $${values.length}`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    if (status) {
      values.push(
        status.toUpperCase(),
      );

      conditions.push(
        `e.employment_status = $${values.length}`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | WHERE
    |--------------------------------------------------------------------------
    */

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND ",
          )}`
        : "";

    /*
    |--------------------------------------------------------------------------
    | Employees
    |--------------------------------------------------------------------------
    */

    const employeeQuery = `
      SELECT
        e.id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.email,
        e.designation,
        e.department_id,
        d.name AS department_name,
        e.joining_date,
        e.employment_status,
        e.employment_type,
        e.created_at,

        COALESCE(
          (
            SELECT STRING_AGG(
              r.name,
              ', '
              ORDER BY r.name
            )
            FROM users u
            INNER JOIN user_roles ur
              ON ur.user_id = u.id
            INNER JOIN roles r
              ON r.id = ur.role_id
            WHERE u.employee_id = e.id
          ),
          'Not Assigned'
        ) AS system_role

      FROM employees e

      LEFT JOIN departments d
        ON d.id = e.department_id

      ${whereClause}

      ORDER BY e.id ASC;
    `;

    const employeeResult =
      await pool.query(
        employeeQuery,
        values,
      );

    /*
    |--------------------------------------------------------------------------
    | Departments
    |--------------------------------------------------------------------------
    */

    const departmentResult =
      await pool.query(`
        SELECT
          id,
          name,
          code
        FROM departments
        ORDER BY name ASC;
      `);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,

      data: {
        employees:
          employeeResult.rows.map(
            (employee) => ({
              id: Number(
                employee.id,
              ),

              employeeCode:
                employee.employee_code,

              firstName:
                employee.first_name,

              lastName:
                employee.last_name,

              fullName:
                `${employee.first_name} ${
                  employee.last_name ?? ""
                }`.trim(),

              email:
                employee.email,

              designation:
                employee.designation ??
                "",

              departmentId:
                employee.department_id
                  ? Number(
                      employee.department_id,
                    )
                  : null,

              department:
                employee.department_name ??
                "Unassigned",

              systemRole:
                employee.system_role ??
                "Not Assigned",

              joiningDate:
                employee.joining_date,

              status:
                employee.employment_status,

              employmentType:
                employee.employment_type,

              createdAt:
                employee.created_at,
            }),
          ),

        total:
          employeeResult.rows.length,

        departments:
          departmentResult.rows.map(
            (department) => ({
              id: Number(
                department.id,
              ),

              name:
                department.name,

              code:
                department.code,
            }),
          ),
      },
    });
  } catch (error) {
    console.error(
      "Employee directory error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load employee directory",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/employees
|--------------------------------------------------------------------------
| Create a new employee
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      designation,
      departmentId,
      joiningDate,
      employmentStatus,
      employmentType,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required field validation
    |--------------------------------------------------------------------------
    */

    if (
      !employeeCode ||
      !firstName ||
      !email ||
      !designation ||
      !departmentId ||
      !joiningDate ||
      !employmentStatus ||
      !employmentType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required employee fields are missing.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create employee
    |--------------------------------------------------------------------------
    */

    try {
      const result =
        await pool.query(
          `
            INSERT INTO employees (
              employee_code,
              first_name,
              last_name,
              email,
              designation,
              department_id,
              joining_date,
              employment_status,
              employment_type
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
              $9
            )
            RETURNING
              id,
              employee_code,
              first_name,
              last_name,
              email,
              designation,
              department_id,
              joining_date,
              employment_status,
              employment_type,
              created_at;
          `,
          [
            employeeCode.trim(),
            firstName.trim(),
            lastName?.trim() || null,
            email.trim(),
            designation.trim(),
            Number(departmentId),
            joiningDate,
            employmentStatus,
            employmentType,
          ],
        );

      const employee =
        result.rows[0];

      /*
      |--------------------------------------------------------------------------
      | Get department name
      |--------------------------------------------------------------------------
      */

      const departmentResult =
        await pool.query(
          `
            SELECT name
            FROM departments
            WHERE id = $1
            LIMIT 1;
          `,
          [departmentId],
        );

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res.status(201).json({
        success: true,

        message:
          "Employee created successfully",

        data: {
          id: Number(
            employee.id,
          ),

          employeeCode:
            employee.employee_code,

          firstName:
            employee.first_name,

          lastName:
            employee.last_name,

          fullName:
            `${employee.first_name} ${
              employee.last_name ?? ""
            }`.trim(),

          email:
            employee.email,

          designation:
            employee.designation ??
            "",

          departmentId:
            employee.department_id
              ? Number(
                  employee.department_id,
                )
              : null,

          department:
            departmentResult.rows[0]
              ?.name ??
            "Unassigned",

          systemRole:
            "Not Assigned",

          joiningDate:
            employee.joining_date,

          status:
            employee.employment_status,

          employmentType:
            employee.employment_type,

          createdAt:
            employee.created_at,
        },
      });
    } catch (insertError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate employee code / email
      |--------------------------------------------------------------------------
      */

      if (
        insertError.code ===
        "23505"
      ) {
        const constraint =
          insertError.constraint ||
          "";

        let field =
          "employee code or email";

        if (
          constraint.includes(
            "email",
          )
        ) {
          field = "email";
        } else if (
          constraint.includes(
            "employee_code",
          )
        ) {
          field = "employee code";
        }

        return res.status(409).json({
          success: false,
          message:
            `An employee with this ${field} already exists.`,
        });
      }

      throw insertError;
    }
  } catch (error) {
    console.error(
      "Employee creation error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create employee",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUT /api/employees/:id
|--------------------------------------------------------------------------
| Update an existing employee
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      employeeCode,
      firstName,
      lastName,
      email,
      designation,
      departmentId,
      joiningDate,
      employmentStatus,
      employmentType,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Confirm employee exists
    |--------------------------------------------------------------------------
    */

    const existingResult =
      await pool.query(
        `
          SELECT id
          FROM employees
          WHERE id = $1
          LIMIT 1;
        `,
        [id],
      );

    if (
      existingResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate required fields
    |--------------------------------------------------------------------------
    */

    if (
      !employeeCode ||
      !firstName ||
      !email ||
      !designation ||
      !joiningDate ||
      !employmentStatus ||
      !employmentType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required employee fields are missing.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update employee
    |--------------------------------------------------------------------------
    */

    try {
      await pool.query(
        `
          UPDATE employees
          SET
            employee_code = $1,
            first_name = $2,
            last_name = $3,
            email = $4,
            designation = $5,
            department_id = $6,
            joining_date = $7,
            employment_status = $8,
            employment_type = $9
          WHERE id = $10;
        `,
        [
          employeeCode.trim(),
          firstName.trim(),
          lastName?.trim() || null,
          email.trim(),
          designation.trim(),
          departmentId
            ? Number(departmentId)
            : null,
          joiningDate,
          employmentStatus,
          employmentType,
          id,
        ],
      );
    } catch (updateError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate employee code / email
      |--------------------------------------------------------------------------
      */

      if (
        updateError.code ===
        "23505"
      ) {
        const constraint =
          updateError.constraint ||
          "";

        let field =
          "employee code or email";

        if (
          constraint.includes(
            "email",
          )
        ) {
          field = "email";
        } else if (
          constraint.includes(
            "employee_code",
          )
        ) {
          field = "employee code";
        }

        return res.status(409).json({
          success: false,
          message:
            `An employee with this ${field} already exists.`,
        });
      }

      throw updateError;
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch updated employee
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(
        `
          SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.email,
            e.designation,
            e.department_id,
            d.name AS department_name,
            e.joining_date,
            e.employment_status,
            e.employment_type,
            e.created_at,

            COALESCE(
              (
                SELECT STRING_AGG(
                  r.name,
                  ', '
                  ORDER BY r.name
                )
                FROM users u
                INNER JOIN user_roles ur
                  ON ur.user_id = u.id
                INNER JOIN roles r
                  ON r.id = ur.role_id
                WHERE u.employee_id = e.id
              ),
              'Not Assigned'
            ) AS system_role

          FROM employees e

          LEFT JOIN departments d
            ON d.id = e.department_id

          WHERE e.id = $1

          LIMIT 1;
        `,
        [id],
      );

    const employee =
      result.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,

      data: {
        id: Number(
          employee.id,
        ),

        employeeCode:
          employee.employee_code,

        firstName:
          employee.first_name,

        lastName:
          employee.last_name,

        fullName:
          `${employee.first_name} ${
            employee.last_name ?? ""
          }`.trim(),

        email:
          employee.email,

        designation:
          employee.designation ??
          "",

        departmentId:
          employee.department_id
            ? Number(
                employee.department_id,
              )
            : null,

        department:
          employee.department_name ??
          "Unassigned",

        systemRole:
          employee.system_role ??
          "Not Assigned",

        joiningDate:
          employee.joining_date,

        status:
          employee.employment_status,

        employmentType:
          employee.employment_type,

        createdAt:
          employee.created_at,
      },
    });
  } catch (error) {
    console.error(
      "Employee update error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update employee",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE /api/employees/:id
|--------------------------------------------------------------------------
| Permanently delete an employee
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    /*
    |--------------------------------------------------------------------------
    | Confirm employee exists
    |--------------------------------------------------------------------------
    */

    const existingResult =
      await pool.query(
        `
          SELECT
            id,
            first_name,
            last_name
          FROM employees
          WHERE id = $1
          LIMIT 1;
        `,
        [id],
      );

    if (
      existingResult.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Employee not found",
      });
    }

    const employee =
      existingResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Permanent deletion
    |--------------------------------------------------------------------------
    */

    try {
      await pool.query(
        `
          DELETE FROM employees
          WHERE id = $1;
        `,
        [id],
      );
    } catch (deleteError) {
      /*
      |--------------------------------------------------------------------------
      | Foreign-key dependency
      |--------------------------------------------------------------------------
      */

      if (
        deleteError.code ===
        "23503"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This employee cannot be permanently deleted because related HR records exist. Deactivate the employee instead.",
        });
      }

      throw deleteError;
    }

    /*
    |--------------------------------------------------------------------------
    | Success response
    |--------------------------------------------------------------------------
    */

    const employeeName =
      `${employee.first_name} ${
        employee.last_name ?? ""
      }`.trim();

    return res.status(200).json({
      success: true,
      message:
        employeeName
          ? `${employeeName} was permanently deleted successfully.`
          : "Employee was permanently deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Employee deletion error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete employee",
    });
  }
});

export default router;