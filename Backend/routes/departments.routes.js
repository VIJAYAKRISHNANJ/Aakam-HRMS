import express from "express";
import pool from "../db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/departments/:id
|--------------------------------------------------------------------------
| Get a single department
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          id,
          name,
          code,
          created_at
        FROM departments
        WHERE id = $1
        LIMIT 1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const department = result.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Employee count
    |--------------------------------------------------------------------------
    */

    const employeeCountResult =
      await pool.query(
        `
          SELECT COUNT(*) AS employee_count
          FROM employees
          WHERE department_id = $1;
        `,
        [id],
      );

    res.json({
      success: true,

      data: {
        id: Number(department.id),

        name:
          department.name,

        code:
          department.code,

        createdAt:
          department.created_at,

        employeeCount:
          Number(
            employeeCountResult
              .rows[0]
              .employee_count,
          ),
      },
    });
  } catch (error) {
    console.error(
      "Department profile error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load department",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/departments
|--------------------------------------------------------------------------
| Get all departments
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
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
          d.name ILIKE $${values.length}
          OR d.code ILIKE $${values.length}
        )
      `);
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
    | Departments
    |--------------------------------------------------------------------------
    */

    const departmentResult =
      await pool.query(
        `
          SELECT
            d.id,
            d.name,
            d.code,
            d.created_at,

            COUNT(e.id) AS employee_count

          FROM departments d

          LEFT JOIN employees e
            ON e.department_id = d.id

          ${whereClause}

          GROUP BY
            d.id,
            d.name,
            d.code,
            d.created_at

          ORDER BY
            d.name ASC;
        `,
        values,
      );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,

      data: {
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

              createdAt:
                department.created_at,

              employeeCount:
                Number(
                  department.employee_count,
                ),
            }),
          ),

        total:
          departmentResult.rows.length,
      },
    });
  } catch (error) {
    console.error(
      "Department directory error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load departments",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/departments
|--------------------------------------------------------------------------
| Create a new department
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const {
      name,
      code,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (
      !name ||
      !code
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department name and code are required.",
      });
    }

    const departmentName =
      name.trim();

    const departmentCode =
      code.trim().toUpperCase();

    if (
      !departmentName ||
      !departmentCode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department name and code are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create department
    |--------------------------------------------------------------------------
    */

    try {
      const result =
        await pool.query(
          `
            INSERT INTO departments (
              name,
              code
            )
            VALUES (
              $1,
              $2
            )
            RETURNING
              id,
              name,
              code,
              created_at;
          `,
          [
            departmentName,
            departmentCode,
          ],
        );

      const department =
        result.rows[0];

      res.status(201).json({
        success: true,

        message:
          "Department created successfully",

        data: {
          id: Number(
            department.id,
          ),

          name:
            department.name,

          code:
            department.code,

          createdAt:
            department.created_at,

          employeeCount: 0,
        },
      });
    } catch (insertError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate department name/code
      |--------------------------------------------------------------------------
      */

      if (
        insertError.code ===
        "23505"
      ) {
        const constraint =
          insertError.constraint ||
          "";

        if (
          constraint.includes(
            "name",
          )
        ) {
          return res.status(409).json({
            success: false,
            message:
              "A department with this name already exists.",
          });
        }

        if (
          constraint.includes(
            "code",
          )
        ) {
          return res.status(409).json({
            success: false,
            message:
              "A department with this code already exists.",
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "A department with this name or code already exists.",
        });
      }

      throw insertError;
    }
  } catch (error) {
    console.error(
      "Department creation error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create department",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUT /api/departments/:id
|--------------------------------------------------------------------------
| Update an existing department
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      code,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (
      !name ||
      !code
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department name and code are required.",
      });
    }

    const departmentName =
      name.trim();

    const departmentCode =
      code.trim().toUpperCase();

    if (
      !departmentName ||
      !departmentCode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department name and code are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Confirm department exists
    |--------------------------------------------------------------------------
    */

    const departmentExists =
      await pool.query(
        `
          SELECT
            id
          FROM departments
          WHERE id = $1
          LIMIT 1;
        `,
        [id],
      );

    if (
      departmentExists.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Department not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update department
    |--------------------------------------------------------------------------
    */

    try {
      const result =
        await pool.query(
          `
            UPDATE departments
            SET
              name = $1,
              code = $2
            WHERE id = $3
            RETURNING
              id,
              name,
              code,
              created_at;
          `,
          [
            departmentName,
            departmentCode,
            id,
          ],
        );

      const department =
        result.rows[0];

      /*
      |--------------------------------------------------------------------------
      | Employee count
      |--------------------------------------------------------------------------
      */

      const employeeCountResult =
        await pool.query(
          `
            SELECT COUNT(*) AS employee_count
            FROM employees
            WHERE department_id = $1;
          `,
          [id],
        );

      res.json({
        success: true,

        message:
          "Department updated successfully",

        data: {
          id: Number(
            department.id,
          ),

          name:
            department.name,

          code:
            department.code,

          createdAt:
            department.created_at,

          employeeCount:
            Number(
              employeeCountResult
                .rows[0]
                .employee_count,
            ),
        },
      });
    } catch (updateError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate department name/code
      |--------------------------------------------------------------------------
      */

      if (
        updateError.code ===
        "23505"
      ) {
        const constraint =
          updateError.constraint ||
          "";

        if (
          constraint.includes(
            "name",
          )
        ) {
          return res.status(409).json({
            success: false,
            message:
              "A department with this name already exists.",
          });
        }

        if (
          constraint.includes(
            "code",
          )
        ) {
          return res.status(409).json({
            success: false,
            message:
              "A department with this code already exists.",
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "A department with this name or code already exists.",
        });
      }

      throw updateError;
    }
  } catch (error) {
    console.error(
      "Department update error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update department",
    });
  }
});

export default router;