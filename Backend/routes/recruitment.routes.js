import express from "express";
import pool from "../db.js";

const router = express.Router();

const JOB_STATUSES = ["OPEN", "CLOSED"];
const CANDIDATE_STAGES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "SELECTED",
  "HIRED",
  "REJECTED",
];

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const parseOptionalInteger = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (!/^-?\d+$/.test(String(value))) return undefined;
  return Number(value);
};

const mapJob = (job) => ({
  id: Number(job.id),
  title: job.title,
  departmentId: job.department_id ? Number(job.department_id) : null,
  department: job.department_name ?? "Unassigned",
  openings: Number(job.openings),
  status: job.status,
  createdAt: job.created_at,
  candidateCount: Number(job.candidate_count ?? 0),
});

const mapCandidate = (candidate) => ({
  id: Number(candidate.id),
  name: candidate.name,
  email: candidate.email ?? "",
  jobPositionId: candidate.job_position_id
    ? Number(candidate.job_position_id)
    : null,
  jobPosition: candidate.job_title ?? "Unassigned",
  department: candidate.department_name ?? "Unassigned",
  stage: candidate.stage,
  createdAt: candidate.created_at,
  appliedAt: candidate.created_at,
});

const jobSelect = `
  SELECT
    j.id,
    j.title,
    j.department_id,
    d.name AS department_name,
    j.openings,
    j.status,
    j.created_at,
    COUNT(c.id) AS candidate_count
  FROM job_positions j
  LEFT JOIN departments d
    ON d.id = j.department_id
  LEFT JOIN candidates c
    ON c.job_position_id = j.id
`;

const candidateSelect = `
  SELECT
    c.id,
    c.name,
    c.email,
    c.job_position_id,
    j.title AS job_title,
    d.name AS department_name,
    c.stage,
    c.created_at
  FROM candidates c
  LEFT JOIN job_positions j
    ON j.id = c.job_position_id
  LEFT JOIN departments d
    ON d.id = j.department_id
`;

const getJob = async (id) => {
  const result = await pool.query(
    `${jobSelect} WHERE j.id = $1 GROUP BY j.id, d.name ORDER BY j.id DESC LIMIT 1;`,
    [id],
  );
  return result.rows[0];
};

const getCandidate = async (id) => {
  const result = await pool.query(
    `${candidateSelect} WHERE c.id = $1 LIMIT 1;`,
    [id],
  );
  return result.rows[0];
};

const validateJobFields = (
  { title, departmentId, openings, status },
  partial = false,
) => {
  if (!partial || title !== undefined) {
    if (typeof title !== "string" || !title.trim()) return "Title is required";
  }

  if (!partial || departmentId !== undefined) {
    const parsedDepartmentId = parseOptionalInteger(departmentId);
    if (
      parsedDepartmentId === undefined ||
      (parsedDepartmentId !== null && parsedDepartmentId <= 0)
    ) {
      return "Department ID must be a positive integer";
    }
  }

  if (!partial || openings !== undefined) {
    const parsedOpenings = parseOptionalInteger(openings);
    if (
      parsedOpenings === undefined ||
      parsedOpenings === null ||
      parsedOpenings <= 0
    ) {
      return "Openings must be a positive integer";
    }
  }

  if (!partial || status !== undefined) {
    if (
      typeof status !== "string" ||
      !JOB_STATUSES.includes(status.toUpperCase())
    ) {
      return "Invalid job status";
    }
  }

  return null;
};

const validateCandidateFields = (
  { name, email, jobPositionId, stage },
  partial = false,
) => {
  if (!partial || name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return "Name is required";
  }

  if (email !== undefined && email !== null && email !== "") {
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return "Invalid email address";
    }
  }

  if (!partial || jobPositionId !== undefined) {
    const parsedJobPositionId = parseOptionalInteger(jobPositionId);
    if (
      parsedJobPositionId === undefined ||
      (parsedJobPositionId !== null && parsedJobPositionId <= 0)
    ) {
      return "Job position ID must be a positive integer";
    }
  }

  if (!partial || stage !== undefined) {
    if (
      typeof stage !== "string" ||
      !CANDIDATE_STAGES.includes(stage.toUpperCase())
    ) {
      return "Invalid candidate stage";
    }
  }

  return null;
};

const verifyDepartment = async (departmentId) => {
  if (departmentId === null) return true;
  const result = await pool.query(
    "SELECT id FROM departments WHERE id = $1 LIMIT 1;",
    [departmentId],
  );
  return result.rows.length > 0;
};

const verifyJobPosition = async (jobPositionId) => {
  if (jobPositionId === null) return true;
  const result = await pool.query(
    "SELECT id FROM job_positions WHERE id = $1 LIMIT 1;",
    [jobPositionId],
  );
  return result.rows.length > 0;
};

router.get("/jobs", async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const values = [];
    const conditions = [];

    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`j.title ILIKE $${values.length}`);
    }

    if (status) {
      const normalizedStatus = status.toUpperCase();
      if (!JOB_STATUSES.includes(normalizedStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid job status" });
      }
      values.push(normalizedStatus);
      conditions.push(`j.status = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    const result = await pool.query(
      `${jobSelect} ${whereClause} GROUP BY j.id, d.name ORDER BY j.created_at DESC, j.id DESC;`,
      values,
    );

    res.json({
      success: true,
      data: result.rows.map(mapJob),
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Recruitment job list error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load job positions" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Job position not found" });
    const job = await getJob(req.params.id);
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Job position not found" });
    res.json({ success: true, data: mapJob(job) });
  } catch (error) {
    console.error("Recruitment job error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load job position" });
  }
});

router.post("/jobs", async (req, res) => {
  try {
    const { title, departmentId = null, openings, status = "OPEN" } = req.body;
    const validationError = validateJobFields({
      title,
      departmentId,
      openings,
      status,
    });
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });

    const parsedDepartmentId = parseOptionalInteger(departmentId);
    if (!(await verifyDepartment(parsedDepartmentId))) {
      return res
        .status(400)
        .json({ success: false, message: "Department not found" });
    }

    const result = await pool.query(
      `INSERT INTO job_positions (title, department_id, openings, status) VALUES ($1, $2, $3, $4) RETURNING id;`,
      [
        title.trim(),
        parsedDepartmentId,
        Number(openings),
        status.toUpperCase(),
      ],
    );
    const job = await getJob(result.rows[0].id);
    res
      .status(201)
      .json({
        success: true,
        message: "Job position created successfully",
        data: mapJob(job),
      });
  } catch (error) {
    console.error("Create recruitment job error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create job position" });
  }
});

router.put("/jobs/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Job position not found" });
    const existingJob = await getJob(req.params.id);
    if (!existingJob)
      return res
        .status(404)
        .json({ success: false, message: "Job position not found" });

    const { title, departmentId, openings, status } = req.body;
    const validationError = validateJobFields(
      { title, departmentId, openings, status },
      true,
    );
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });

    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };
    if (title !== undefined) addUpdate("title", title.trim());
    if (departmentId !== undefined)
      addUpdate("department_id", parseOptionalInteger(departmentId));
    if (openings !== undefined) addUpdate("openings", Number(openings));
    if (status !== undefined) addUpdate("status", status.toUpperCase());
    if (!updates.length)
      return res
        .status(400)
        .json({ success: false, message: "At least one field is required" });

    const departmentValue =
      departmentId === undefined
        ? existingJob.department_id
        : parseOptionalInteger(departmentId);
    if (!(await verifyDepartment(departmentValue)))
      return res
        .status(400)
        .json({ success: false, message: "Department not found" });
    values.push(req.params.id);
    await pool.query(
      `UPDATE job_positions SET ${updates.join(", ")} WHERE id = $${values.length};`,
      values,
    );
    const job = await getJob(req.params.id);
    res.json({
      success: true,
      message: "Job position updated successfully",
      data: mapJob(job),
    });
  } catch (error) {
    console.error("Update recruitment job error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update job position" });
  }
});

router.delete("/jobs/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Job position not found" });
    const job = await getJob(req.params.id);
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Job position not found" });
    const candidates = await pool.query(
      "SELECT 1 FROM candidates WHERE job_position_id = $1 LIMIT 1;",
      [req.params.id],
    );
    if (candidates.rows.length)
      return res
        .status(409)
        .json({
          success: false,
          message: "Cannot delete a job position that has candidates.",
        });
    await pool.query("DELETE FROM job_positions WHERE id = $1;", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Job position deleted successfully" });
  } catch (error) {
    console.error("Delete recruitment job error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete job position" });
  }
});

router.get("/candidates", async (req, res) => {
  try {
    const { search = "", stage = "", jobPositionId = "" } = req.query;
    const values = [];
    const conditions = [];
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(
        `(c.name ILIKE $${values.length} OR c.email ILIKE $${values.length})`,
      );
    }
    if (stage) {
      const normalizedStage = stage.toUpperCase();
      if (!CANDIDATE_STAGES.includes(normalizedStage))
        return res
          .status(400)
          .json({ success: false, message: "Invalid candidate stage" });
      values.push(normalizedStage);
      conditions.push(`c.stage = $${values.length}`);
    }
    if (jobPositionId) {
      const parsedJobPositionId = parseOptionalInteger(jobPositionId);
      if (parsedJobPositionId === undefined || parsedJobPositionId <= 0)
        return res
          .status(400)
          .json({
            success: false,
            message: "Job position ID must be a positive integer",
          });
      values.push(parsedJobPositionId);
      conditions.push(`c.job_position_id = $${values.length}`);
    }
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    const result = await pool.query(
      `${candidateSelect} ${whereClause} ORDER BY c.created_at DESC, c.id DESC;`,
      values,
    );
    res.json({
      success: true,
      data: result.rows.map(mapCandidate),
      total: result.rows.length,
    });
  } catch (error) {
    console.error("Recruitment candidate list error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load candidates" });
  }
});

router.get("/candidates/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    const candidate = await getCandidate(req.params.id);
    if (!candidate)
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    res.json({ success: true, data: mapCandidate(candidate) });
  } catch (error) {
    console.error("Recruitment candidate error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load candidate" });
  }
});

router.post("/candidates", async (req, res) => {
  try {
    const {
      name,
      email = null,
      jobPositionId = null,
      stage = "APPLIED",
    } = req.body;
    const validationError = validateCandidateFields({
      name,
      email,
      jobPositionId,
      stage,
    });
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });
    const parsedJobPositionId = parseOptionalInteger(jobPositionId);
    if (!(await verifyJobPosition(parsedJobPositionId)))
      return res
        .status(400)
        .json({ success: false, message: "Job position not found" });
    const result = await pool.query(
      `INSERT INTO candidates (name, email, job_position_id, stage) VALUES ($1, $2, $3, $4) RETURNING id;`,
      [
        name.trim(),
        email?.trim() || null,
        parsedJobPositionId,
        stage.toUpperCase(),
      ],
    );
    const candidate = await getCandidate(result.rows[0].id);
    res
      .status(201)
      .json({
        success: true,
        message: "Candidate created successfully",
        data: mapCandidate(candidate),
      });
  } catch (error) {
    console.error("Create recruitment candidate error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create candidate" });
  }
});

router.put("/candidates/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    const existingCandidate = await getCandidate(req.params.id);
    if (!existingCandidate)
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    const { name, email, jobPositionId, stage } = req.body;
    const validationError = validateCandidateFields(
      { name, email, jobPositionId, stage },
      true,
    );
    if (validationError)
      return res.status(400).json({ success: false, message: validationError });
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };
    if (name !== undefined) addUpdate("name", name.trim());
    if (email !== undefined) addUpdate("email", email?.trim() || null);
    if (jobPositionId !== undefined)
      addUpdate("job_position_id", parseOptionalInteger(jobPositionId));
    if (stage !== undefined) addUpdate("stage", stage.toUpperCase());
    if (!updates.length)
      return res
        .status(400)
        .json({ success: false, message: "At least one field is required" });
    const jobValue =
      jobPositionId === undefined
        ? existingCandidate.job_position_id
        : parseOptionalInteger(jobPositionId);
    if (!(await verifyJobPosition(jobValue)))
      return res
        .status(400)
        .json({ success: false, message: "Job position not found" });
    values.push(req.params.id);
    await pool.query(
      `UPDATE candidates SET ${updates.join(", ")} WHERE id = $${values.length};`,
      values,
    );
    const candidate = await getCandidate(req.params.id);
    res.json({
      success: true,
      message: "Candidate updated successfully",
      data: mapCandidate(candidate),
    });
  } catch (error) {
    console.error("Update recruitment candidate error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update candidate" });
  }
});

router.put("/candidates/:id/stage", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    const candidate = await getCandidate(req.params.id);
    if (!candidate)
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    const stage = req.body.stage;
    if (
      typeof stage !== "string" ||
      !CANDIDATE_STAGES.includes(stage.toUpperCase())
    )
      return res
        .status(400)
        .json({ success: false, message: "Invalid candidate stage" });
    await pool.query("UPDATE candidates SET stage = $1 WHERE id = $2;", [
      stage.toUpperCase(),
      req.params.id,
    ]);
    const updatedCandidate = await getCandidate(req.params.id);
    res.json({
      success: true,
      message: "Candidate stage updated successfully",
      data: mapCandidate(updatedCandidate),
    });
  } catch (error) {
    console.error("Update candidate stage error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update candidate stage" });
  }
});

router.delete("/candidates/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    const result = await pool.query(
      "DELETE FROM candidates WHERE id = $1 RETURNING id;",
      [req.params.id],
    );
    if (!result.rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    res.json({ success: true, message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Delete recruitment candidate error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete candidate" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM job_positions) AS total_job_positions,
        (SELECT COUNT(*) FROM job_positions WHERE status = 'OPEN') AS open_positions,
        (SELECT COUNT(*) FROM candidates) AS total_candidates,
        (SELECT COUNT(*) FROM candidates WHERE stage = 'INTERVIEW') AS in_interview,
        (SELECT COUNT(*) FROM candidates WHERE stage = 'SELECTED') AS selected,
        (SELECT COUNT(*) FROM candidates WHERE stage = 'HIRED') AS hired,
        (SELECT COUNT(*) FROM candidates WHERE stage = 'APPLIED') AS applied,
        (SELECT COUNT(*) FROM candidates WHERE stage = 'SCREENING') AS screening,
        (SELECT COUNT(*) FROM candidates WHERE stage = 'REJECTED') AS rejected;
    `);
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        totalJobPositions: Number(row.total_job_positions),
        openPositions: Number(row.open_positions),
        totalCandidates: Number(row.total_candidates),
        inInterview: Number(row.in_interview),
        selected: Number(row.selected),
        hired: Number(row.hired),
        pipeline: {
          APPLIED: Number(row.applied),
          SCREENING: Number(row.screening),
          INTERVIEW: Number(row.in_interview),
          SELECTED: Number(row.selected),
          HIRED: Number(row.hired),
          REJECTED: Number(row.rejected),
        },
      },
    });
  } catch (error) {
    console.error("Recruitment stats error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to load recruitment statistics",
      });
  }
});

export default router;
