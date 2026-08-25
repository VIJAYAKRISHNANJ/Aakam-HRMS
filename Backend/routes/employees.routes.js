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
| Employee directory
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
    | Department filter
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
    | Status filter
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

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND ",
          )}`
        : "";

    /*
    |--------------------------------------------------------------------------
    | Employee query
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
    | Department query
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
                  employee.last_name ?? ""
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
      departmentId,
      joiningDate,
      status = "ACTIVE",
      employmentType = "FULL_TIME",
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate required fields
    |--------------------------------------------------------------------------
    */

    if (
      !employeeCode ||
      !firstName ||
      !email ||
      !joiningDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee code, first name, email, and joining date are required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Clean input
    |--------------------------------------------------------------------------
    */

    const cleanEmployeeCode =
      employeeCode.trim();

    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName?.trim() || null;

    const cleanEmail =
      email.trim().toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Validate employee code
    |--------------------------------------------------------------------------
    */

    const employeeCodeCheck =
      await pool.query(
        `
          SELECT id
          FROM employees
          WHERE employee_code = $1
          LIMIT 1;
        `,
        [cleanEmployeeCode],
      );

    if (
      employeeCodeCheck.rows.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Employee code already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate email
    |--------------------------------------------------------------------------
    */

    const emailCheck =
      await pool.query(
        `
          SELECT id
          FROM employees
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1;
        `,
        [cleanEmail],
      );

    if (
      emailCheck.rows.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Employee email already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate department
    |--------------------------------------------------------------------------
    */

    let cleanDepartmentId =
      null;

    if (
      departmentId !== undefined &&
      departmentId !== null &&
      departmentId !== ""
    ) {
      cleanDepartmentId =
        Number(departmentId);

      if (
        !Number.isInteger(
          cleanDepartmentId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid department ID",
        });
      }

      const departmentCheck =
        await pool.query(
          `
            SELECT id
            FROM departments
            WHERE id = $1
            LIMIT 1;
          `,
          [cleanDepartmentId],
        );

      if (
        departmentCheck.rows.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected department does not exist",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Validate joining date
    |--------------------------------------------------------------------------
    */

    const parsedDate =
      new Date(joiningDate);

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid joining date",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize status/type
    |--------------------------------------------------------------------------
    */

    const cleanStatus =
      String(status)
        .trim()
        .toUpperCase();

    const cleanEmploymentType =
      String(employmentType)
        .trim()
        .toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | Insert employee
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(
        `
          INSERT INTO employees (
            employee_code,
            first_name,
            last_name,
            email,
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
            $8
          )
          RETURNING
            id,
            employee_code,
            first_name,
            last_name,
            email,
            department_id,
            joining_date,
            employment_status,
            employment_type,
            created_at;
        `,
        [
          cleanEmployeeCode,
          cleanFirstName,
          cleanLastName,
          cleanEmail,
          cleanDepartmentId,
          joiningDate,
          cleanStatus,
          cleanEmploymentType,
        ],
      );

    const employee =
      result.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Success response
    |--------------------------------------------------------------------------
    */

    res.status(201).json({
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

        departmentId:
          employee.department_id
            ? Number(
                employee.department_id,
              )
            : null,

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
      "Create employee error:",
      error,
    );

    /*
    |--------------------------------------------------------------------------
    | PostgreSQL unique constraint fallback
    |--------------------------------------------------------------------------
    */

    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Employee code or email already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PostgreSQL foreign key fallback
    |--------------------------------------------------------------------------
    */

    if (
      error.code === "23503"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid department",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | General error
    |--------------------------------------------------------------------------
    */

    res.status(500).json({
      success: false,
      message:
        "Failed to create employee",
    });
  }
});

export default router;