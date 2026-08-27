import express from "express";
import pool from "../db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/companies
|--------------------------------------------------------------------------
| Get all companies
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        company_code,
        legal_name,
        display_name,
        registration_number,
        pan,
        tan,
        gstin,
        email,
        phone,
        address,
        logo_url,
        financial_year_start,
        payroll_frequency,
        status,
        created_at,
        updated_at
      FROM companies
      ORDER BY id ASC;
    `);

    res.json({
      success: true,
      data: result.rows.map((company) => ({
        id: Number(company.id),
        companyCode: company.company_code,
        legalName: company.legal_name,
        displayName: company.display_name,
        registrationNumber: company.registration_number,
        pan: company.pan,
        tan: company.tan,
        gstin: company.gstin,
        email: company.email,
        phone: company.phone,
        address: company.address,
        logoUrl: company.logo_url,
        financialYearStart: company.financial_year_start,
        payrollFrequency: company.payroll_frequency,
        status: company.status,
        createdAt: company.created_at,
        updatedAt: company.updated_at,
      })),
    });
  } catch (error) {
    console.error("Company list error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load companies",
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET /api/companies/:id
|--------------------------------------------------------------------------
| Get a single company
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        SELECT
          id,
          company_code,
          legal_name,
          display_name,
          registration_number,
          pan,
          tan,
          gstin,
          email,
          phone,
          address,
          logo_url,
          financial_year_start,
          payroll_frequency,
          status,
          created_at,
          updated_at
        FROM companies
        WHERE id = $1
        LIMIT 1;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const company = result.rows[0];

    res.json({
      success: true,
      data: {
        id: Number(company.id),
        companyCode: company.company_code,
        legalName: company.legal_name,
        displayName: company.display_name,
        registrationNumber: company.registration_number,
        pan: company.pan,
        tan: company.tan,
        gstin: company.gstin,
        email: company.email,
        phone: company.phone,
        address: company.address,
        logoUrl: company.logo_url,
        financialYearStart: company.financial_year_start,
        payrollFrequency: company.payroll_frequency,
        status: company.status,
        createdAt: company.created_at,
        updatedAt: company.updated_at,
      },
    });
  } catch (error) {
    console.error("Company profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load company",
    });
  }
});


/*
|--------------------------------------------------------------------------
| POST /api/companies
|--------------------------------------------------------------------------
| Create a new company
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const {
      companyCode,
      legalName,
      displayName,
      registrationNumber,
      pan,
      tan,
      gstin,
      email,
      phone,
      address,
      logoUrl,
      financialYearStart,
      payrollFrequency,
      status,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required validation
    |--------------------------------------------------------------------------
    */

    if (!companyCode || !legalName) {
      return res.status(400).json({
        success: false,
        message:
          "Company code and legal name are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create company
    |--------------------------------------------------------------------------
    */

    try {
      const result = await pool.query(
        `
          INSERT INTO companies (
            company_code,
            legal_name,
            display_name,
            registration_number,
            pan,
            tan,
            gstin,
            email,
            phone,
            address,
            logo_url,
            financial_year_start,
            payroll_frequency,
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
            company_code,
            legal_name,
            display_name,
            registration_number,
            pan,
            tan,
            gstin,
            email,
            phone,
            address,
            logo_url,
            financial_year_start,
            payroll_frequency,
            status,
            created_at,
            updated_at;
        `,
        [
          companyCode.trim(),
          legalName.trim(),
          displayName?.trim() || null,
          registrationNumber?.trim() || null,
          pan?.trim() || null,
          tan?.trim() || null,
          gstin?.trim() || null,
          email?.trim() || null,
          phone?.trim() || null,
          address?.trim() || null,
          logoUrl?.trim() || null,
          financialYearStart || null,
          payrollFrequency || "MONTHLY",
          status || "ACTIVE",
        ],
      );

      const company = result.rows[0];

      res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: {
          id: Number(company.id),
          companyCode: company.company_code,
          legalName: company.legal_name,
          displayName: company.display_name,
          registrationNumber:
            company.registration_number,
          pan: company.pan,
          tan: company.tan,
          gstin: company.gstin,
          email: company.email,
          phone: company.phone,
          address: company.address,
          logoUrl: company.logo_url,
          financialYearStart:
            company.financial_year_start,
          payrollFrequency:
            company.payroll_frequency,
          status: company.status,
          createdAt: company.created_at,
          updatedAt: company.updated_at,
        },
      });
    } catch (insertError) {
      /*
      |--------------------------------------------------------------------------
      | Duplicate company code
      |--------------------------------------------------------------------------
      */

      if (insertError.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A company with this company code already exists.",
        });
      }

      throw insertError;
    }
  } catch (error) {
    console.error("Company creation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create company",
    });
  }
});


/*
|--------------------------------------------------------------------------
| PUT /api/companies/:id
|--------------------------------------------------------------------------
| Update an existing company
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyCode,
      legalName,
      displayName,
      registrationNumber,
      pan,
      tan,
      gstin,
      email,
      phone,
      address,
      logoUrl,
      financialYearStart,
      payrollFrequency,
      status,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required validation
    |--------------------------------------------------------------------------
    */

    if (!companyCode || !legalName) {
      return res.status(400).json({
        success: false,
        message:
          "Company code and legal name are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check company exists
    |--------------------------------------------------------------------------
    */

    const existingResult = await pool.query(
      `
        SELECT id
        FROM companies
        WHERE id = $1
        LIMIT 1;
      `,
      [id],
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Update company
    |--------------------------------------------------------------------------
    */

    try {
      await pool.query(
        `
          UPDATE companies
          SET
            company_code = $1,
            legal_name = $2,
            display_name = $3,
            registration_number = $4,
            pan = $5,
            tan = $6,
            gstin = $7,
            email = $8,
            phone = $9,
            address = $10,
            logo_url = $11,
            financial_year_start = $12,
            payroll_frequency = $13,
            status = $14,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $15;
        `,
        [
          companyCode.trim(),
          legalName.trim(),
          displayName?.trim() || null,
          registrationNumber?.trim() || null,
          pan?.trim() || null,
          tan?.trim() || null,
          gstin?.trim() || null,
          email?.trim() || null,
          phone?.trim() || null,
          address?.trim() || null,
          logoUrl?.trim() || null,
          financialYearStart || null,
          payrollFrequency || "MONTHLY",
          status || "ACTIVE",
          id,
        ],
      );
    } catch (updateError) {
      if (updateError.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A company with this company code already exists.",
        });
      }

      throw updateError;
    }

    /*
    |--------------------------------------------------------------------------
    | Return updated company
    |--------------------------------------------------------------------------
    */

    const result = await pool.query(
      `
        SELECT
          id,
          company_code,
          legal_name,
          display_name,
          registration_number,
          pan,
          tan,
          gstin,
          email,
          phone,
          address,
          logo_url,
          financial_year_start,
          payroll_frequency,
          status,
          created_at,
          updated_at
        FROM companies
        WHERE id = $1
        LIMIT 1;
      `,
      [id],
    );

    const company = result.rows[0];

    res.json({
      success: true,
      message: "Company updated successfully",
      data: {
        id: Number(company.id),
        companyCode: company.company_code,
        legalName: company.legal_name,
        displayName: company.display_name,
        registrationNumber:
          company.registration_number,
        pan: company.pan,
        tan: company.tan,
        gstin: company.gstin,
        email: company.email,
        phone: company.phone,
        address: company.address,
        logoUrl: company.logo_url,
        financialYearStart:
          company.financial_year_start,
        payrollFrequency:
          company.payroll_frequency,
        status: company.status,
        createdAt: company.created_at,
        updatedAt: company.updated_at,
      },
    });
  } catch (error) {
    console.error("Company update error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update company",
    });
  }
});


/*
|--------------------------------------------------------------------------
| DELETE /api/companies/:id
|--------------------------------------------------------------------------
| Delete a company
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        DELETE FROM companies
        WHERE id = $1
        RETURNING id;
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Company deletion error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete company",
    });
  }
});


export default router;