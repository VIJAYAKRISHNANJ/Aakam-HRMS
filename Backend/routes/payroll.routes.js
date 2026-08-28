import express from "express";
import pool from "../db.js";

const router = express.Router();

const PAYROLL_STATUSES = ["PENDING", "PROCESSING", "COMPLETED"];
const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidPayrollMonth = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapPayrollRun = (run) => ({
  id: Number(run.id),
  payrollMonth: formatPayrollMonth(run.payroll_month),
  status: run.status,
  pendingApprovals: Number(run.pending_approvals),
  createdAt: run.created_at,
});

const getPayrollRun = async (id) => {
  const result = await pool.query(
    `
      SELECT id, payroll_month, status, pending_approvals, created_at
      FROM payroll_runs
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );

  return result.rows[0];
};

const validateFields = (
  { payrollMonth, status, pendingApprovals },
  partial = false,
) => {
  if (
    (!partial || payrollMonth !== undefined) &&
    !isValidPayrollMonth(payrollMonth)
  ) {
    return "Payroll month must be the first day of a valid month in YYYY-MM-DD format";
  }

  if (
    status !== undefined &&
    (typeof status !== "string" ||
      !PAYROLL_STATUSES.includes(status.toUpperCase()))
  ) {
    return "Invalid payroll status";
  }

  if (
    pendingApprovals !== undefined &&
    (!Number.isInteger(pendingApprovals) || pendingApprovals < 0)
  ) {
    return "Pending approvals must be a non-negative integer";
  }

  return null;
};

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, payroll_month, status, pending_approvals, created_at
      FROM payroll_runs
      ORDER BY payroll_month DESC, id DESC;
    `);

    res.json({
      success: true,
      data: result.rows.map(mapPayrollRun),
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Payroll list error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load payroll runs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payroll run ID" });
    }

    const payrollRun = await getPayrollRun(req.params.id);
    if (!payrollRun) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll run not found" });
    }

    res.json({ success: true, data: mapPayrollRun(payrollRun) });
  } catch (error) {
    console.error("Payroll profile error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load payroll run" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { payrollMonth, status = "PENDING", pendingApprovals = 0 } = req.body;
    const normalizedStatus =
      typeof status === "string" ? status.toUpperCase() : status;
    const validationError = validateFields({
      payrollMonth,
      status: normalizedStatus,
      pendingApprovals,
    });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const result = await pool.query(
      `
        INSERT INTO payroll_runs (payroll_month, status, pending_approvals)
        VALUES ($1, $2, $3)
        RETURNING id, payroll_month, status, pending_approvals, created_at;
      `,
      [payrollMonth, normalizedStatus, pendingApprovals],
    );

    res.status(201).json({
      success: true,
      message: "Payroll run created successfully",
      data: mapPayrollRun(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A payroll run already exists for this month",
      });
    }

    console.error("Create payroll error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payroll run" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payroll run ID" });
    }

    const existing = await getPayrollRun(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll run not found" });
    }
    if (existing.status === "COMPLETED") {
      return res
        .status(409)
        .json({
          success: false,
          message: "Completed payroll runs cannot be updated",
        });
    }

    const { payrollMonth, status, pendingApprovals } = req.body;
    const normalizedStatus =
      typeof status === "string" ? status.toUpperCase() : status;
    const normalizedApprovals =
      pendingApprovals === undefined
        ? pendingApprovals
        : Number(pendingApprovals);
    const validationError = validateFields(
      {
        payrollMonth,
        status: normalizedStatus,
        pendingApprovals: normalizedApprovals,
      },
      true,
    );

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    if (normalizedStatus === "PENDING" && existing.status === "PROCESSING") {
      return res
        .status(409)
        .json({
          success: false,
          message: "A processing payroll run cannot return to pending",
        });
    }
    if (normalizedStatus === "COMPLETED") {
      return res
        .status(409)
        .json({
          success: false,
          message: "Use the complete endpoint to complete payroll",
        });
    }

    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (payrollMonth !== undefined) addUpdate("payroll_month", payrollMonth);
    if (normalizedStatus !== undefined) addUpdate("status", normalizedStatus);
    if (normalizedApprovals !== undefined)
      addUpdate("pending_approvals", normalizedApprovals);

    if (!updates.length) {
      return res
        .status(400)
        .json({ success: false, message: "At least one field is required" });
    }

    values.push(req.params.id);
    const result = await pool.query(
      `
        UPDATE payroll_runs
        SET ${updates.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, payroll_month, status, pending_approvals, created_at;
      `,
      values,
    );

    res.json({
      success: true,
      message: "Payroll run updated successfully",
      data: mapPayrollRun(result.rows[0]),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({
          success: false,
          message: "A payroll run already exists for this month",
        });
    }

    console.error("Update payroll error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update payroll run" });
  }
});

router.post("/:id/process", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payroll run ID" });
    }

    const result = await pool.query(
      `
        UPDATE payroll_runs
        SET status = 'PROCESSING'
        WHERE id = $1 AND status = 'PENDING'
        RETURNING id, payroll_month, status, pending_approvals, created_at;
      `,
      [req.params.id],
    );
    if (!result.rows.length) {
      const existing = await getPayrollRun(req.params.id);
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Payroll run not found" });
      return res
        .status(409)
        .json({
          success: false,
          message: "Only pending payroll runs can be processed",
        });
    }

    res.json({
      success: true,
      message: "Payroll processing started",
      data: mapPayrollRun(result.rows[0]),
    });
  } catch (error) {
    console.error("Process payroll error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to process payroll run" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payroll run ID" });
    }

    const result = await pool.query(
      `
        UPDATE payroll_runs
        SET pending_approvals = pending_approvals - 1
        WHERE id = $1 AND status = 'PROCESSING' AND pending_approvals > 0
        RETURNING id, payroll_month, status, pending_approvals, created_at;
      `,
      [req.params.id],
    );
    if (!result.rows.length) {
      const existing = await getPayrollRun(req.params.id);
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Payroll run not found" });
      return res
        .status(409)
        .json({
          success: false,
          message: "Payroll run has no pending approval or is not processing",
        });
    }

    res.json({
      success: true,
      message: "Payroll approval recorded",
      data: mapPayrollRun(result.rows[0]),
    });
  } catch (error) {
    console.error("Approve payroll error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to approve payroll run" });
  }
});

router.post("/:id/complete", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payroll run ID" });
    }

    const result = await pool.query(
      `
        UPDATE payroll_runs
        SET status = 'COMPLETED'
        WHERE id = $1 AND status = 'PROCESSING' AND pending_approvals = 0
        RETURNING id, payroll_month, status, pending_approvals, created_at;
      `,
      [req.params.id],
    );
    if (!result.rows.length) {
      const existing = await getPayrollRun(req.params.id);
      if (!existing)
        return res
          .status(404)
          .json({ success: false, message: "Payroll run not found" });
      return res
        .status(409)
        .json({
          success: false,
          message:
            "Payroll must be processing with no pending approvals before completion",
        });
    }

    res.json({
      success: true,
      message: "Payroll run completed successfully",
      data: mapPayrollRun(result.rows[0]),
    });
  } catch (error) {
    console.error("Complete payroll error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to complete payroll run" });
  }
});

export default router;
