import express from "express";
import pool from "../db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/branches/:id
|--------------------------------------------------------------------------
| Get a single branch
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          b.id,
          b.company_id,
          c.company_code,
          c.display_name AS company_name,
          b.branch_code,
          b.branch_name,
          b.location,
          b.address,
          b.phone,
          b.email,
          b.status,
          b.created_at,
          b.updated_at
        FROM branches b
        INNER JOIN companies c
          ON c.id = b.company_id
        WHERE b.id = $1
        LIMIT 1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branch = result.rows[0];

    res.json({
      success: true,
      data: {
        id: Number(branch.id),

        companyId: Number(
          branch.company_id,
        ),

        companyCode:
          branch.company_code,

        companyName:
          branch.company_name,

        branchCode:
          branch.branch_code,

        branchName:
          branch.branch_name,

        location:
          branch.location,

        address:
          branch.address,

        phone:
          branch.phone,

        email:
          branch.email,

        status:
          branch.status,

        createdAt:
          branch.created_at,

        updatedAt:
          branch.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "Branch profile error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load branch",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/branches
|--------------------------------------------------------------------------
| Get all branches
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const {
      companyId = "",
      status = "",
      search = "",
    } = req.query;

    const values = [];
    const conditions = [];

    /*
    |--------------------------------------------------------------------------
    | Company filter
    |--------------------------------------------------------------------------
    */

    if (companyId) {
      values.push(Number(companyId));

      conditions.push(
        `b.company_id = $${values.length}`,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Status filter
    |--------------------------------------------------------------------------
    */

    if (status) {
      values.push(
        status
          .toString()
          .toUpperCase(),
      );

      conditions.push(
        `b.status = $${values.length}`,
      );
    }

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
          b.branch_code ILIKE $${values.length}
          OR b.branch_name ILIKE $${values.length}
          OR COALESCE(b.location, '') ILIKE $${values.length}
          OR COALESCE(c.display_name, '') ILIKE $${values.length}
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
    | Branches
    |--------------------------------------------------------------------------
    */

    const branchResult =
      await pool.query(
        `
          SELECT
            b.id,
            b.company_id,
            c.company_code,
            c.display_name AS company_name,
            b.branch_code,
            b.branch_name,
            b.location,
            b.address,
            b.phone,
            b.email,
            b.status,
            b.created_at,
            b.updated_at

          FROM branches b

          INNER JOIN companies c
            ON c.id = b.company_id

          ${whereClause}

          ORDER BY
            b.id ASC;
        `,
        values,
      );

    /*
    |--------------------------------------------------------------------------
    | Companies
    |--------------------------------------------------------------------------
    | Used by the frontend dropdown when creating/editing branches.
    |--------------------------------------------------------------------------
    */

    const companyResult =
      await pool.query(
        `
          SELECT
            id,
            company_code,
            display_name,
            legal_name
          FROM companies
          WHERE status = 'ACTIVE'
          ORDER BY display_name ASC;
        `,
      );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,

      data: {
        branches:
          branchResult.rows.map(
            (branch) => ({
              id: Number(
                branch.id,
              ),

              companyId:
                Number(
                  branch.company_id,
                ),

              companyCode:
                branch.company_code,

              companyName:
                branch.company_name,

              branchCode:
                branch.branch_code,

              branchName:
                branch.branch_name,

              location:
                branch.location,

              address:
                branch.address,

              phone:
                branch.phone,

              email:
                branch.email,

              status:
                branch.status,

              createdAt:
                branch.created_at,

              updatedAt:
                branch.updated_at,
            }),
          ),

        total:
          branchResult.rows.length,

        companies:
          companyResult.rows.map(
            (company) => ({
              id: Number(
                company.id,
              ),

              companyCode:
                company.company_code,

              displayName:
                company.display_name,

              legalName:
                company.legal_name,
            }),
          ),
      },
    });
  } catch (error) {
    console.error(
      "Branch directory error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load branches",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/branches
|--------------------------------------------------------------------------
| Create a new branch
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const {
      companyId,
      branchCode,
      branchName,
      location,
      address,
      phone,
      email,
      status,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (
      !companyId ||
      !branchCode ||
      !branchName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Company, branch code, and branch name are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Confirm company exists
    |--------------------------------------------------------------------------
    */

    const companyResult =
      await pool.query(
        `
          SELECT
            id,
            company_code,
            display_name
          FROM companies
          WHERE id = $1
          LIMIT 1;
        `,
        [companyId],
      );

    if (
      companyResult.rows.length ===
      0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected company does not exist.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create branch
    |--------------------------------------------------------------------------
    */

    try {
      const result =
        await pool.query(
          `
            INSERT INTO branches (
              company_id,
              branch_code,
              branch_name,
              location,
              address,
              phone,
              email,
              status
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
              company_id,
              branch_code,
              branch_name,
              location,
              address,
              phone,
              email,
              status,
              created_at,
              updated_at;
          `,
          [
            Number(companyId),

            branchCode.trim(),

            branchName.trim(),

            location?.trim() ||
              null,

            address?.trim() ||
              null,

            phone?.trim() ||
              null,

            email?.trim() ||
              null,

            status
              ? status
                  .toString()
                  .toUpperCase()
              : "ACTIVE",
          ],
        );

      const branch =
        result.rows[0];

      const company =
        companyResult.rows[0];

      res.status(201).json({
        success: true,

        message:
          "Branch created successfully",

        data: {
          id: Number(
            branch.id,
          ),

          companyId:
            Number(
              branch.company_id,
            ),

          companyCode:
            company.company_code,

          companyName:
            company.display_name,

          branchCode:
            branch.branch_code,

          branchName:
            branch.branch_name,

          location:
            branch.location,

          address:
            branch.address,

          phone:
            branch.phone,

          email:
            branch.email,

          status:
            branch.status,

          createdAt:
            branch.created_at,

          updatedAt:
            branch.updated_at,
        },
      });
    } catch (insertError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate branch code for same company
      |--------------------------------------------------------------------------
      */

      if (
        insertError.code ===
        "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A branch with this code already exists for the selected company.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Invalid company foreign key
      |--------------------------------------------------------------------------
      */

      if (
        insertError.code ===
        "23503"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected company does not exist.",
        });
      }

      throw insertError;
    }
  } catch (error) {
    console.error(
      "Branch creation error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create branch",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUT /api/branches/:id
|--------------------------------------------------------------------------
| Update an existing branch
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyId,
      branchCode,
      branchName,
      location,
      address,
      phone,
      email,
      status,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (
      !companyId ||
      !branchCode ||
      !branchName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Company, branch code, and branch name are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Confirm branch exists
    |--------------------------------------------------------------------------
    */

    const branchExists =
      await pool.query(
        `
          SELECT id
          FROM branches
          WHERE id = $1
          LIMIT 1;
        `,
        [id],
      );

    if (
      branchExists.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Branch not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Confirm company exists
    |--------------------------------------------------------------------------
    */

    const companyResult =
      await pool.query(
        `
          SELECT
            id,
            company_code,
            display_name
          FROM companies
          WHERE id = $1
          LIMIT 1;
        `,
        [companyId],
      );

    if (
      companyResult.rows.length ===
      0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected company does not exist.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update branch
    |--------------------------------------------------------------------------
    */

    try {
      await pool.query(
        `
          UPDATE branches
          SET
            company_id = $1,
            branch_code = $2,
            branch_name = $3,
            location = $4,
            address = $5,
            phone = $6,
            email = $7,
            status = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9;
        `,
        [
          Number(companyId),

          branchCode.trim(),

          branchName.trim(),

          location?.trim() ||
            null,

          address?.trim() ||
            null,

          phone?.trim() ||
            null,

          email?.trim() ||
            null,

          status
            ? status
                .toString()
                .toUpperCase()
            : "ACTIVE",

          id,
        ],
      );
    } catch (updateError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate branch code
      |--------------------------------------------------------------------------
      */

      if (
        updateError.code ===
        "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A branch with this code already exists for the selected company.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Invalid company
      |--------------------------------------------------------------------------
      */

      if (
        updateError.code ===
        "23503"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected company does not exist.",
        });
      }

      throw updateError;
    }

    /*
    |--------------------------------------------------------------------------
    | Fetch updated branch
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(
        `
          SELECT
            b.id,
            b.company_id,
            c.company_code,
            c.display_name AS company_name,
            b.branch_code,
            b.branch_name,
            b.location,
            b.address,
            b.phone,
            b.email,
            b.status,
            b.created_at,
            b.updated_at
          FROM branches b
          INNER JOIN companies c
            ON c.id = b.company_id
          WHERE b.id = $1
          LIMIT 1;
        `,
        [id],
      );

    const branch =
      result.rows[0];

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,

      message:
        "Branch updated successfully",

      data: {
        id: Number(
          branch.id,
        ),

        companyId:
          Number(
            branch.company_id,
          ),

        companyCode:
          branch.company_code,

        companyName:
          branch.company_name,

        branchCode:
          branch.branch_code,

        branchName:
          branch.branch_name,

        location:
          branch.location,

        address:
          branch.address,

        phone:
          branch.phone,

        email:
          branch.email,

        status:
          branch.status,

        createdAt:
          branch.created_at,

        updatedAt:
          branch.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "Branch update error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update branch",
    });
  }
});

export default router;