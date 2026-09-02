import express from "express";
import pool from "../db.js";

const router = express.Router();

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const parseFilters = (query, allowed = []) => {
  const { startDate = "", endDate = "", departmentId = "", companyId = "", branchId = "" } = query;
  const filters = {};

  if (startDate && !isValidDate(startDate)) return { error: "Invalid startDate. Use YYYY-MM-DD format" };
  if (endDate && !isValidDate(endDate)) return { error: "Invalid endDate. Use YYYY-MM-DD format" };
  if (startDate && endDate && startDate > endDate) return { error: "startDate cannot be after endDate" };

  for (const [name, value] of [["departmentId", departmentId], ["companyId", companyId], ["branchId", branchId]]) {
    if (value && !isValidId(value)) return { error: `Invalid ${name}` };
    if (value && !allowed.includes(name)) return { error: `${name} is not supported for this report` };
  }

  if (startDate && !allowed.includes("date")) return { error: "Date filters are not supported for this report" };
  if (endDate && !allowed.includes("date")) return { error: "Date filters are not supported for this report" };

  filters.startDate = startDate;
  filters.endDate = endDate;
  filters.departmentId = departmentId ? Number(departmentId) : null;
  filters.companyId = companyId ? Number(companyId) : null;
  filters.branchId = branchId ? Number(branchId) : null;
  return { filters };
};

const dateConditions = (filters, column, values, overlap = false) => {
  const conditions = [];
  if (filters.startDate) {
    values.push(filters.startDate);
    conditions.push(overlap ? `${column.end} >= $${values.length}` : `${column} >= $${values.length}`);
  }
  if (filters.endDate) {
    values.push(filters.endDate);
    conditions.push(overlap ? `${column.start} <= $${values.length}` : `${column} <= $${values.length}`);
  }
  return conditions;
};

const withWhere = (conditions) => (conditions.length ? `WHERE ${conditions.join(" AND ")}` : "");

const queryCount = async (query, values = []) => {
  const result = await pool.query(query, values);
  return Number(result.rows[0].count);
};

router.get("/summary", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM employees) AS total_employees,
        (SELECT COUNT(*) FROM employees WHERE employment_status = 'ACTIVE') AS active_employees,
        (SELECT COUNT(*) FROM job_positions) AS total_positions,
        (SELECT COUNT(*) FROM job_positions WHERE status = 'OPEN') AS open_positions,
        (SELECT COUNT(*) FROM candidates) AS total_candidates,
        (SELECT COUNT(*) FROM onboardings) AS total_onboardings,
        (SELECT COUNT(*) FROM payroll_runs) AS total_payroll_runs,
        (SELECT COUNT(*) FROM performance_reviews) AS total_performance_reviews,
        (SELECT COUNT(*) FROM training_programs) AS total_training_programs,
        (SELECT COUNT(*) FROM training_enrollments) AS total_training_enrollments;
    `);
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        workforce: { totalEmployees: Number(row.total_employees), activeEmployees: Number(row.active_employees) },
        recruitment: { totalPositions: Number(row.total_positions), openPositions: Number(row.open_positions), totalCandidates: Number(row.total_candidates) },
        onboarding: { totalOnboardings: Number(row.total_onboardings) },
        payroll: { totalPayrollRuns: Number(row.total_payroll_runs) },
        performance: { totalReviews: Number(row.total_performance_reviews) },
        training: { totalPrograms: Number(row.total_training_programs), totalEnrollments: Number(row.total_training_enrollments) },
      },
    });
  } catch (error) {
    console.error("Reports summary error:", error);
    res.status(500).json({ success: false, message: "Failed to load reports summary" });
  }
});

router.get("/workforce", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date", "departmentId"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const employeeValues = [];
    const employeeConditions = dateConditions(filters, "e.joining_date", employeeValues);
    if (filters.departmentId) { employeeValues.push(filters.departmentId); employeeConditions.push(`e.department_id = $${employeeValues.length}`); }
    const employeeWhere = withWhere(employeeConditions);

    const departmentValues = [];
    const departmentConditions = dateConditions(filters, "e.joining_date", departmentValues);
    if (filters.departmentId) { departmentValues.push(filters.departmentId); departmentConditions.push(`d.id = $${departmentValues.length}`); }
    const departmentWhere = withWhere(departmentConditions);

    const [totals, departments, companies, branches] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE e.employment_status = 'ACTIVE') AS active, COUNT(*) FILTER (WHERE e.employment_status <> 'ACTIVE') AS inactive FROM employees e ${employeeWhere};`, employeeValues),
      pool.query(`SELECT d.id, d.name, d.code, COUNT(e.id) AS employee_count FROM departments d LEFT JOIN employees e ON e.department_id = d.id ${departmentWhere} GROUP BY d.id, d.name, d.code ORDER BY d.name;`, departmentValues),
      pool.query(`SELECT c.id, c.company_code, c.display_name, c.legal_name FROM companies c ORDER BY c.display_name, c.id;`),
      pool.query(`SELECT b.id, b.company_id, c.display_name AS company_name, b.branch_code, b.branch_name, b.location FROM branches b INNER JOIN companies c ON c.id = b.company_id ORDER BY c.display_name, b.branch_name;`),
    ]);
    res.json({
      success: true,
      data: {
        totals: { totalEmployees: Number(totals.rows[0].total), activeEmployees: Number(totals.rows[0].active), inactiveEmployees: Number(totals.rows[0].inactive) },
        byDepartment: departments.rows.map((row) => ({ id: Number(row.id), name: row.name, code: row.code, employeeCount: Number(row.employee_count) })),
        byCompany: companies.rows.map((row) => ({ id: Number(row.id), companyCode: row.company_code, name: row.display_name || row.legal_name, employeeCount: null })),
        byBranch: branches.rows.map((row) => ({ id: Number(row.id), companyId: Number(row.company_id), companyName: row.company_name, branchCode: row.branch_code, name: row.branch_name, location: row.location, employeeCount: null })),
        companyBranchLimitation: "Employees are not currently related to companies or branches in the database, so employee counts by company and branch are unavailable.",
      },
    });
  } catch (error) {
    console.error("Workforce report error:", error);
    res.status(500).json({ success: false, message: "Failed to load workforce report" });
  }
});

router.get("/departments", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date", "departmentId"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const values = [];
    const conditions = dateConditions(filters, "e.joining_date", values);
    if (filters.departmentId) { values.push(filters.departmentId); conditions.push(`d.id = $${values.length}`); }
    const result = await pool.query(`SELECT d.id, d.name, d.code, COUNT(e.id) AS employee_count FROM departments d LEFT JOIN employees e ON e.department_id = d.id ${withWhere(conditions)} GROUP BY d.id, d.name, d.code ORDER BY d.name;`, values);
    res.json({ success: true, data: result.rows.map((row) => ({ id: Number(row.id), name: row.name, code: row.code, employeeCount: Number(row.employee_count) })), total: result.rows.length });
  } catch (error) {
    console.error("Department report error:", error);
    res.status(500).json({ success: false, message: "Failed to load department report" });
  }
});

router.get("/companies", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["companyId"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const values = [];
    const conditions = [];
    if (parsed.filters.companyId) { values.push(parsed.filters.companyId); conditions.push(`c.id = $${values.length}`); }
    const companies = await pool.query(`SELECT c.id, c.company_code, c.display_name, c.legal_name FROM companies c ${withWhere(conditions)} ORDER BY c.display_name, c.id;`, values);
    const branches = await pool.query("SELECT b.id, b.company_id, b.branch_code, b.branch_name, b.location, c.display_name AS company_name FROM branches b INNER JOIN companies c ON c.id = b.company_id ORDER BY c.display_name, b.branch_name;");
    res.json({ success: true, data: { companies: companies.rows.map((row) => ({ id: Number(row.id), companyCode: row.company_code, name: row.display_name || row.legal_name, employeeCount: null })), branches: branches.rows.map((row) => ({ id: Number(row.id), companyId: Number(row.company_id), companyName: row.company_name, branchCode: row.branch_code, name: row.branch_name, location: row.location, employeeCount: null })), limitation: "Employee company and branch relationships are not present in the current database schema." } });
  } catch (error) {
    console.error("Company report error:", error);
    res.status(500).json({ success: false, message: "Failed to load company and branch report" });
  }
});

router.get("/recruitment", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date", "departmentId"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const positionValues = [];
    const candidateValues = [];
    const positionConditions = dateConditions(filters, "jp.created_at", positionValues);
    const candidateConditions = dateConditions(filters, "c.created_at", candidateValues);
    if (filters.departmentId) { positionValues.push(filters.departmentId); positionConditions.push(`jp.department_id = $${positionValues.length}`); candidateValues.push(filters.departmentId); candidateConditions.push(`jp.department_id = $${candidateValues.length}`); }
    const [positions, candidates, stages] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE jp.status = 'OPEN') AS open, COUNT(*) FILTER (WHERE jp.status = 'CLOSED') AS closed FROM job_positions jp ${withWhere(positionConditions)};`, positionValues),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE c.stage = 'HIRED') AS hired, COUNT(*) FILTER (WHERE c.stage = 'REJECTED') AS rejected FROM candidates c LEFT JOIN job_positions jp ON jp.id = c.job_position_id ${withWhere(candidateConditions)};`, candidateValues),
      pool.query(`SELECT c.stage, COUNT(*) AS total FROM candidates c LEFT JOIN job_positions jp ON jp.id = c.job_position_id ${withWhere(candidateConditions)} GROUP BY c.stage ORDER BY c.stage;`, candidateValues),
    ]);
    res.json({ success: true, data: { positions: { total: Number(positions.rows[0].total), open: Number(positions.rows[0].open), closed: Number(positions.rows[0].closed) }, candidates: { total: Number(candidates.rows[0].total), hired: Number(candidates.rows[0].hired), rejected: Number(candidates.rows[0].rejected), byStage: stages.rows.map((row) => ({ stage: row.stage, total: Number(row.total) })) } } });
  } catch (error) {
    console.error("Recruitment report error:", error);
    res.status(500).json({ success: false, message: "Failed to load recruitment report" });
  }
});

router.get("/onboarding", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date", "departmentId"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const values = [];
    const conditions = dateConditions(filters, "o.expected_joining_date", values);
    if (filters.departmentId) { values.push(filters.departmentId); conditions.push(`o.department_id = $${values.length}`); }
    const result = await pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE o.status = 'INITIATED') AS initiated, COUNT(*) FILTER (WHERE o.status = 'DOCUMENTS_PENDING') AS documents_pending, COUNT(*) FILTER (WHERE o.status = 'VERIFICATION_PENDING') AS verification_pending, COUNT(*) FILTER (WHERE o.status = 'READY_TO_JOIN') AS ready_to_join, COUNT(*) FILTER (WHERE o.status = 'JOINED') AS joined, COUNT(*) FILTER (WHERE o.status = 'IN_PROGRESS') AS in_progress, COUNT(*) FILTER (WHERE o.status = 'COMPLETED') AS completed, COUNT(*) FILTER (WHERE o.status = 'CANCELLED') AS cancelled FROM onboardings o ${withWhere(conditions)};`, values);
    const row = result.rows[0];
    res.json({ success: true, data: { total: Number(row.total), initiated: Number(row.initiated), documentsPending: Number(row.documents_pending), verificationPending: Number(row.verification_pending), readyToJoin: Number(row.ready_to_join), joined: Number(row.joined), inProgress: Number(row.in_progress), completed: Number(row.completed), cancelled: Number(row.cancelled) } });
  } catch (error) {
    console.error("Onboarding report error:", error);
    res.status(500).json({ success: false, message: "Failed to load onboarding report" });
  }
});

router.get("/payroll", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const values = [];
    const conditions = dateConditions(filters, "pr.payroll_month", values);
    const whereClause = withWhere(conditions);
    const [summary, months, approvals] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE pr.status = 'PENDING') AS pending, COUNT(*) FILTER (WHERE pr.status = 'PROCESSING') AS processing, COUNT(*) FILTER (WHERE pr.status = 'COMPLETED') AS completed FROM payroll_runs pr ${whereClause};`, values),
      pool.query(`SELECT pr.payroll_month, COUNT(*) AS total FROM payroll_runs pr ${whereClause} GROUP BY pr.payroll_month ORDER BY pr.payroll_month;`, values),
      pool.query(`SELECT COALESCE(SUM(pr.pending_approvals), 0) AS pending, COALESCE(AVG(pr.pending_approvals), 0) AS average FROM payroll_runs pr ${whereClause};`, values),
    ]);
    const row = summary.rows[0];
    res.json({ success: true, data: { total: Number(row.total), pending: Number(row.pending), processing: Number(row.processing), completed: Number(row.completed), byMonth: months.rows.map((item) => ({ month: formatDateOnly(item.payroll_month), total: Number(item.total) })), approvals: { pending: Number(approvals.rows[0].pending), averagePendingPerRun: Number(approvals.rows[0].average) } } });
  } catch (error) {
    console.error("Payroll report error:", error);
    res.status(500).json({ success: false, message: "Failed to load payroll report" });
  }
});

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

router.get("/performance", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date", "departmentId"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const values = [];
    const conditions = dateConditions(filters, { start: "pr.review_period_start", end: "pr.review_period_end" }, values, true);
    if (filters.departmentId) { values.push(filters.departmentId); conditions.push(`e.department_id = $${values.length}`); }
    const whereClause = withWhere(conditions);
    const departmentValues = [];
    const departmentConditions = dateConditions(filters, { start: "pr.review_period_start", end: "pr.review_period_end" }, departmentValues, true);
    if (filters.departmentId) { departmentValues.push(filters.departmentId); departmentConditions.push(`d.id = $${departmentValues.length}`); }
    const [summary, ratings, departments] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE pr.status = 'DRAFT') AS draft, COUNT(*) FILTER (WHERE pr.status = 'IN_REVIEW') AS in_review, COUNT(*) FILTER (WHERE pr.status = 'COMPLETED') AS completed, COALESCE(AVG(pr.rating), 0) AS average_rating FROM performance_reviews pr INNER JOIN employees e ON e.id = pr.employee_id ${whereClause};`, values),
      pool.query(`SELECT pr.rating, COUNT(*) AS total FROM performance_reviews pr INNER JOIN employees e ON e.id = pr.employee_id ${whereClause} AND pr.rating IS NOT NULL GROUP BY pr.rating ORDER BY pr.rating;`, values),
      pool.query(`SELECT d.id, d.name, COUNT(pr.id) AS review_count FROM departments d LEFT JOIN employees e ON e.department_id = d.id LEFT JOIN performance_reviews pr ON pr.employee_id = e.id ${withWhere(departmentConditions)} GROUP BY d.id, d.name ORDER BY d.name;`, departmentValues),
    ]);
    const row = summary.rows[0];
    res.json({ success: true, data: { total: Number(row.total), draft: Number(row.draft), inReview: Number(row.in_review), completed: Number(row.completed), averageRating: Number(row.average_rating), ratingDistribution: ratings.rows.map((item) => ({ rating: Number(item.rating), total: Number(item.total) })), byDepartment: departments.rows.map((item) => ({ id: Number(item.id), name: item.name, total: Number(item.review_count) })) } });
  } catch (error) {
    console.error("Performance report error:", error);
    res.status(500).json({ success: false, message: "Failed to load performance report" });
  }
});

router.get("/training", async (req, res) => {
  try {
    const parsed = parseFilters(req.query, ["date"]);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });
    const { filters } = parsed;
    const programValues = [];
    const enrollmentValues = [];
    const programConditions = dateConditions(filters, "tp.created_at", programValues);
    const enrollmentConditions = dateConditions(filters, "te.created_at", enrollmentValues);
    const [programs, enrollments, categories, completion, assessments] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE tp.status = 'ACTIVE') AS active, COUNT(*) FILTER (WHERE tp.status = 'INACTIVE') AS inactive FROM training_programs tp ${withWhere(programConditions)};`, programValues),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE te.status = 'COMPLETED') AS completed FROM training_enrollments te INNER JOIN training_programs tp ON tp.id = te.training_program_id ${withWhere(enrollmentConditions)};`, enrollmentValues),
      pool.query(`SELECT tp.category, COUNT(*) AS total FROM training_programs tp ${withWhere(programConditions)} GROUP BY tp.category ORDER BY tp.category;`, programValues),
      pool.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE te.status = 'COMPLETED') AS completed FROM training_enrollments te INNER JOIN training_programs tp ON tp.id = te.training_program_id ${withWhere(enrollmentConditions)};`, enrollmentValues),
      pool.query(`SELECT COUNT(*) FILTER (WHERE te.assessment_result = 'PASS') AS pass, COUNT(*) FILTER (WHERE te.assessment_result = 'FAIL') AS fail FROM training_enrollments te INNER JOIN training_programs tp ON tp.id = te.training_program_id ${withWhere(enrollmentConditions)};`, enrollmentValues),
    ]);
    const programRow = programs.rows[0];
    const enrollmentRow = enrollments.rows[0];
    res.json({ success: true, data: { programs: { total: Number(programRow.total), active: Number(programRow.active), inactive: Number(programRow.inactive), byCategory: categories.rows.map((item) => ({ category: item.category, total: Number(item.total) })) }, enrollments: { total: Number(enrollmentRow.total), completed: Number(enrollmentRow.completed), completionRate: Number(enrollmentRow.total) ? Math.round((Number(enrollmentRow.completed) / Number(enrollmentRow.total)) * 100) : 0 }, assessmentResults: { pass: Number(assessments.rows[0].pass), fail: Number(assessments.rows[0].fail) } } });
  } catch (error) {
    console.error("Training report error:", error);
    res.status(500).json({ success: false, message: "Failed to load training report" });
  }
});

export default router;
