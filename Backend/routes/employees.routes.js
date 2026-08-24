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
          e.department_id,
          d.name AS department_name,
          e.joining_date,
          e.employment_status,
          e.employment_type,
          e.created_at
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

    res.json({
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

        departmentId:
          employee.department_id
            ? Number(employee.department_id)
            : null,

        department:
          employee.department_name ??
          "Unassigned",

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

    res.status(500).json({
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
        e.department_id,
        d.name AS department_name,
        e.joining_date,
        e.employment_status,
        e.employment_type,
        e.created_at

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

    res.json({
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
                  employee.last_name ??
                  ""
                }`.trim(),

              email:
                employee.email,

              departmentId:
                employee.department_id
                  ? Number(
                      employee.department_id,
                    )
                  : null,

              department:
                employee.department_name ??
                "Unassigned",

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

    res.status(500).json({
      success: false,
      message:
        "Failed to load employee directory",
    });
  }
});

export default router;