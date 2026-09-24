import express from "express";
import pool from "../db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const isSuperAdmin = (req) =>
  req.user?.role === "SUPER_ADMINISTRATOR" ||
  req.user?.roles?.includes?.("SUPER_ADMINISTRATOR");

const getCompanyId = (req) =>
  req.user?.requestedCompanyId ?? req.user?.company_id ?? null;

const isValidId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
};

const addReviewScope = (req, values, conditions, alias = "pr") => {
  if (!isSuperAdmin(req)) {
    const companyId = getCompanyId(req);

    if (companyId !== null && companyId !== undefined) {
      values.push(companyId);
      conditions.push(`${alias}.company_id = $${values.length}`);
    }
  }

  if (req.user?.role === "EMPLOYEE") {
    const employeeId = req.user?.employee_id;

    if (employeeId) {
      values.push(employeeId);
      conditions.push(`${alias}.employee_id = $${values.length}`);
    }
  }

  if (req.user?.role === "MANAGER") {
    const employeeId = req.user?.employee_id;

    if (employeeId) {
      values.push(employeeId);
      conditions.push(`${alias}.reviewer_id = $${values.length}`);
    }
  }
};

const mapReview = (row) => ({
  id: Number(row.id),

  employeeId: row.employee_id
    ? Number(row.employee_id)
    : null,

  employeeCode: row.employee_code ?? "",

  employeeName:
    `${row.employee_first_name ?? ""} ${
      row.employee_last_name ?? ""
    }`.trim(),

  employeeEmail: row.employee_email ?? "",

  employeeDesignation:
    row.employee_designation ?? "",

  departmentId: row.department_id
    ? Number(row.department_id)
    : null,

  department:
    row.department_name ?? "Unassigned",

  reviewerId: row.reviewer_id
    ? Number(row.reviewer_id)
    : null,

  reviewerEmployeeCode:
    row.reviewer_employee_code ?? "",

  reviewerName:
    `${row.reviewer_first_name ?? ""} ${
      row.reviewer_last_name ?? ""
    }`.trim(),

  reviewerEmail:
    row.reviewer_email ?? "",

  reviewPeriodStart:
    row.review_period_start,

  reviewPeriodEnd:
    row.review_period_end,

  rating:
    row.rating === null ||
    row.rating === undefined
      ? null
      : Number(row.rating),

  status:
    row.status,

  companyId:
    row.company_id
      ? Number(row.company_id)
      : null,

  createdAt:
    row.created_at,

  updatedAt:
    row.updated_at,

  goals:
    Array.isArray(row.goals)
      ? row.goals
      : [],
});

const mapGoal = (row) => ({
  id: Number(row.id),

  performanceReviewId:
    Number(row.performance_review_id),

  title:
    row.title,

  description:
    row.description ?? "",

  target:
    row.target ?? "",

  status:
    row.status,

  createdAt:
    row.created_at,

  updatedAt:
    row.updated_at,
});

/*
|--------------------------------------------------------------------------
| GET /api/performance
| List performance reviews
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const values = [];
    const conditions = [];

    addReviewScope(
      req,
      values,
      conditions,
      "pr",
    );

    if (req.query.employeeId) {
      const employeeId =
        Number(req.query.employeeId);

      if (!isValidId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      values.push(employeeId);

      conditions.push(
        `pr.employee_id = $${values.length}`,
      );
    }

    if (req.query.reviewerId) {
      const reviewerId =
        Number(req.query.reviewerId);

      if (!isValidId(reviewerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid reviewer ID",
        });
      }

      values.push(reviewerId);

      conditions.push(
        `pr.reviewer_id = $${values.length}`,
      );
    }

    if (req.query.status) {
      values.push(
        String(req.query.status),
      );

      conditions.push(
        `pr.status = $${values.length}`,
      );
    }

    if (req.query.startDate) {
      values.push(
        String(req.query.startDate),
      );

      conditions.push(
        `pr.review_period_start >= $${values.length}`,
      );
    }

    if (req.query.endDate) {
      values.push(
        String(req.query.endDate),
      );

      conditions.push(
        `pr.review_period_end <= $${values.length}`,
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
        SELECT
          pr.id,
          pr.employee_id,
          pr.reviewer_id,

          pr.review_period_start,
          pr.review_period_end,

          pr.rating,
          pr.status,

          pr.company_id,

          pr.created_at,
          pr.updated_at,

          e.employee_code,
          e.first_name AS employee_first_name,
          e.last_name AS employee_last_name,
          e.email AS employee_email,
          e.designation AS employee_designation,
          e.department_id,

          d.name AS department_name,

          reviewer.employee_code AS reviewer_employee_code,
          reviewer.first_name AS reviewer_first_name,
          reviewer.last_name AS reviewer_last_name,
          reviewer.email AS reviewer_email

        FROM performance_reviews pr

        INNER JOIN employees e
          ON e.id = pr.employee_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        LEFT JOIN employees reviewer
          ON reviewer.id = pr.reviewer_id

        ${whereClause}

        ORDER BY
          pr.review_period_end DESC,
          pr.id DESC
      `,
      values,
    );

    return res.json(
      result.rows.map(mapReview),
    );
  } catch (error) {
    console.error(
      "Failed to list performance reviews:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load performance reviews",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/performance/summary
|--------------------------------------------------------------------------
*/

router.get("/summary", async (req, res) => {
  try {
    const values = [];
    const conditions = [];

    addReviewScope(
      req,
      values,
      conditions,
      "pr",
    );

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
        SELECT
          COUNT(*)::INTEGER AS total_reviews,

          COUNT(*) FILTER (
            WHERE pr.status = 'COMPLETED'
          )::INTEGER AS completed_reviews,

          COUNT(*) FILTER (
            WHERE pr.status = 'DRAFT'
          )::INTEGER AS draft_reviews,

          COUNT(*) FILTER (
            WHERE pr.status = 'IN_REVIEW'
          )::INTEGER AS in_review_reviews,

          ROUND(
            AVG(pr.rating)::NUMERIC,
            2
          ) AS average_rating

        FROM performance_reviews pr

        ${whereClause}
      `,
      values,
    );

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Failed to load performance summary:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load performance summary",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/performance/employees
|--------------------------------------------------------------------------
*/

router.get("/employees", async (req, res) => {
  try {
    const values = [];
    const conditions = [
      "e.employment_status = 'ACTIVE'",
    ];

    if (!isSuperAdmin(req)) {
      const companyId = getCompanyId(req);

      if (companyId !== null) {
        values.push(companyId);

        conditions.push(
          `e.company_id = $${values.length}`,
        );
      }
    }

    if (req.user?.role === "EMPLOYEE") {
      values.push(req.user.employee_id);

      conditions.push(
        `e.id = $${values.length}`,
      );
    }

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
          d.name AS department_name

        FROM employees e

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE ${conditions.join(" AND ")}

        ORDER BY
          e.first_name ASC,
          e.last_name ASC
      `,
      values,
    );

    return res.json(
      result.rows.map((employee) => ({
        id: Number(employee.id),

        employeeCode:
          employee.employee_code,

        firstName:
          employee.first_name,

        lastName:
          employee.last_name,

        fullName:
          `${employee.first_name ?? ""} ${
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
      })),
    );
  } catch (error) {
    console.error(
      "Failed to load performance employees:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load performance employees",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/performance/reviewers
|--------------------------------------------------------------------------
*/

router.get("/reviewers", async (req, res) => {
  try {
    const values = [];
    const conditions = [
      "e.employment_status = 'ACTIVE'",
    ];

    if (!isSuperAdmin(req)) {
      const companyId = getCompanyId(req);

      if (companyId !== null) {
        values.push(companyId);

        conditions.push(
          `e.company_id = $${values.length}`,
        );
      }
    }

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
          d.name AS department_name

        FROM employees e

        LEFT JOIN departments d
          ON d.id = e.department_id

        WHERE ${conditions.join(" AND ")}

        ORDER BY
          e.first_name ASC,
          e.last_name ASC
      `,
      values,
    );

    return res.json(
      result.rows.map((employee) => ({
        id: Number(employee.id),

        employeeCode:
          employee.employee_code,

        firstName:
          employee.first_name,

        lastName:
          employee.last_name,

        fullName:
          `${employee.first_name ?? ""} ${
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
      })),
    );
  } catch (error) {
    console.error(
      "Failed to load performance reviewers:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load performance reviewers",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/performance/analytics/status
|--------------------------------------------------------------------------
*/

router.get(
  "/analytics/status",
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      addReviewScope(
        req,
        values,
        conditions,
        "pr",
      );

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(" AND ")}`
          : "";

      const result = await pool.query(
        `
          SELECT
            pr.status,
            COUNT(*)::INTEGER AS count

          FROM performance_reviews pr

          ${whereClause}

          GROUP BY
            pr.status

          ORDER BY
            pr.status
        `,
        values,
      );

      return res.json(
        result.rows.map((row) => ({
          status: row.status,
          count: Number(row.count),
        })),
      );
    } catch (error) {
      console.error(
        "Failed to load performance status analytics:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load performance status analytics",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET /api/performance/analytics/ratings
|--------------------------------------------------------------------------
*/

router.get(
  "/analytics/ratings",
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      addReviewScope(
        req,
        values,
        conditions,
        "pr",
      );

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(" AND ")}`
          : "";

      const result = await pool.query(
        `
          SELECT
            pr.rating,
            COUNT(*)::INTEGER AS count

          FROM performance_reviews pr

          ${whereClause}

          GROUP BY
            pr.rating

          ORDER BY
            pr.rating
        `,
        values,
      );

      return res.json(
        result.rows.map((row) => ({
          rating:
            row.rating === null
              ? null
              : Number(row.rating),

          count:
            Number(row.count),
        })),
      );
    } catch (error) {
      console.error(
        "Failed to load performance rating analytics:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load performance rating analytics",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET /api/performance/analytics/departments
|--------------------------------------------------------------------------
*/

router.get(
  "/analytics/departments",
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      addReviewScope(
        req,
        values,
        conditions,
        "pr",
      );

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(" AND ")}`
          : "";

      const result = await pool.query(
        `
          SELECT
            d.id AS department_id,
            d.name AS department_name,

            COUNT(pr.id)::INTEGER AS review_count,

            ROUND(
              AVG(pr.rating)::NUMERIC,
              2
            ) AS average_rating

          FROM performance_reviews pr

          INNER JOIN employees e
            ON e.id = pr.employee_id

          LEFT JOIN departments d
            ON d.id = e.department_id

          ${whereClause}

          GROUP BY
            d.id,
            d.name

          ORDER BY
            d.name
        `,
        values,
      );

      return res.json(
        result.rows.map((row) => ({
          departmentId:
            row.department_id
              ? Number(row.department_id)
              : null,

          departmentName:
            row.department_name ??
            "Unassigned",

          reviewCount:
            Number(row.review_count),

          averageRating:
            row.average_rating === null
              ? null
              : Number(row.average_rating),
        })),
      );
    } catch (error) {
      console.error(
        "Failed to load performance department analytics:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load performance department analytics",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET /api/performance/:id
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const reviewId =
      Number(req.params.id);

    if (!isValidId(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const values = [reviewId];
    const conditions = [
      "pr.id = $1",
    ];

    addReviewScope(
      req,
      values,
      conditions,
      "pr",
    );

    const result = await pool.query(
      `
        SELECT
          pr.id,
          pr.employee_id,
          pr.reviewer_id,

          pr.review_period_start,
          pr.review_period_end,

          pr.rating,
          pr.status,

          pr.company_id,

          pr.created_at,
          pr.updated_at,

          e.employee_code,
          e.first_name AS employee_first_name,
          e.last_name AS employee_last_name,
          e.email AS employee_email,
          e.designation AS employee_designation,
          e.department_id,

          d.name AS department_name,

          reviewer.employee_code AS reviewer_employee_code,
          reviewer.first_name AS reviewer_first_name,
          reviewer.last_name AS reviewer_last_name,
          reviewer.email AS reviewer_email

        FROM performance_reviews pr

        INNER JOIN employees e
          ON e.id = pr.employee_id

        LEFT JOIN departments d
          ON d.id = e.department_id

        LEFT JOIN employees reviewer
          ON reviewer.id = pr.reviewer_id

        WHERE ${conditions.join(" AND ")}

        LIMIT 1
      `,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Performance review not found",
      });
    }

    return res.json(
      mapReview(result.rows[0]),
    );
  } catch (error) {
    console.error(
      "Failed to load performance review:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load performance review",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/performance/:id/goals
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/goals",
  async (req, res) => {
    try {
      const reviewId =
        Number(req.params.id);

      if (!isValidId(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID",
        });
      }

      const reviewValues = [reviewId];
      const reviewConditions = [
        "pr.id = $1",
      ];

      addReviewScope(
        req,
        reviewValues,
        reviewConditions,
        "pr",
      );

      const reviewResult =
        await pool.query(
          `
            SELECT
              pr.id

            FROM performance_reviews pr

            WHERE ${reviewConditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          reviewValues,
        );

      if (reviewResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      const result = await pool.query(
        `
          SELECT
            pg.id,
            pg.performance_review_id,
            pg.title,
            pg.description,
            pg.target,
            pg.status,
            pg.created_at,
            pg.updated_at

          FROM performance_goals pg

          WHERE
            pg.performance_review_id = $1

          ORDER BY
            pg.id ASC
        `,
        [reviewId],
      );

      return res.json(
        result.rows.map(mapGoal),
      );
    } catch (error) {
      console.error(
        "Failed to load performance goals:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load performance goals",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| POST /api/performance
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  const client =
    await pool.connect();

  try {
    const {
      employeeId,
      reviewerId,
      reviewPeriodStart,
      reviewPeriodEnd,
      rating,
      status,
      goals,
    } = req.body;

    const normalizedEmployeeId =
      Number(employeeId);

    const normalizedReviewerId =
      reviewerId === null ||
      reviewerId === undefined ||
      reviewerId === ""
        ? null
        : Number(reviewerId);

    if (
      !isValidId(
        normalizedEmployeeId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid employee ID is required",
      });
    }

    if (
      normalizedReviewerId !== null &&
      !isValidId(
        normalizedReviewerId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid reviewer ID",
      });
    }

    if (!reviewPeriodStart) {
      return res.status(400).json({
        success: false,
        message:
          "Review period start is required",
      });
    }

    if (!reviewPeriodEnd) {
      return res.status(400).json({
        success: false,
        message:
          "Review period end is required",
      });
    }

    if (
      new Date(reviewPeriodStart) >
      new Date(reviewPeriodEnd)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Review period start cannot be after review period end",
      });
    }

    if (
      rating !== null &&
      rating !== undefined &&
      rating !== "" &&
      (!Number.isInteger(
        Number(rating),
      ) ||
        Number(rating) < 1 ||
        Number(rating) > 5)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be between 1 and 5",
      });
    }

    const reviewStatus =
      status || "DRAFT";

    const allowedStatuses = [
      "DRAFT",
      "IN_REVIEW",
      "COMPLETED",
    ];

    if (
      !allowedStatuses.includes(
        reviewStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid performance review status",
      });
    }

    await client.query("BEGIN");

    /*
     * Validate employee and obtain company.
     */

    const employeeValues = [
      normalizedEmployeeId,
    ];

    const employeeConditions = [
      "e.id = $1",
    ];

    if (!isSuperAdmin(req)) {
      const companyId =
        getCompanyId(req);

      if (companyId !== null) {
        employeeValues.push(
          companyId,
        );

        employeeConditions.push(
          `e.company_id = $${employeeValues.length}`,
        );
      }
    }

    const employeeResult =
      await client.query(
        `
          SELECT
            e.id,
            e.company_id

          FROM employees e

          WHERE ${employeeConditions.join(
            " AND ",
          )}

          LIMIT 1
        `,
        employeeValues,
      );

    if (
      employeeResult.rows.length === 0
    ) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(404).json({
        success: false,
        message:
          "Employee not found or outside your company scope",
      });
    }

    const employeeCompanyId =
      employeeResult.rows[0]
        .company_id;

    if (!employeeCompanyId) {
      await client.query(
        "ROLLBACK",
      );

      return res.status(400).json({
        success: false,
        message:
          "Employee is not assigned to a company",
      });
    }

    /*
     * Validate reviewer.
     */

    if (
      normalizedReviewerId !== null
    ) {
      const reviewerValues = [
        normalizedReviewerId,
      ];

      const reviewerConditions = [
        "e.id = $1",
      ];

      if (!isSuperAdmin(req)) {
        const companyId =
          getCompanyId(req);

        if (companyId !== null) {
          reviewerValues.push(
            companyId,
          );

          reviewerConditions.push(
            `e.company_id = $${reviewerValues.length}`,
          );
        }
      }

      const reviewerResult =
        await client.query(
          `
            SELECT
              e.id

            FROM employees e

            WHERE ${reviewerConditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          reviewerValues,
        );

      if (
        reviewerResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(404).json({
          success: false,
          message:
            "Reviewer not found or outside your company scope",
        });
      }
    }

    /*
     * Create review.
     */

    const reviewResult =
      await client.query(
        `
          INSERT INTO performance_reviews (
            employee_id,
            reviewer_id,
            review_period_start,
            review_period_end,
            rating,
            status,
            company_id
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          )

          RETURNING
            id,
            employee_id,
            reviewer_id,
            review_period_start,
            review_period_end,
            rating,
            status,
            company_id,
            created_at,
            updated_at
        `,
        [
          normalizedEmployeeId,
          normalizedReviewerId,
          reviewPeriodStart,
          reviewPeriodEnd,
          rating === "" ||
          rating === undefined
            ? null
            : rating,
          reviewStatus,
          employeeCompanyId,
        ],
      );

    const review =
      reviewResult.rows[0];

    /*
     * Create optional goals.
     */

    if (Array.isArray(goals)) {
      for (const goal of goals) {
        if (
          !goal ||
          typeof goal !== "object"
        ) {
          continue;
        }

        const title =
          String(
            goal.title ?? "",
          ).trim();

        if (!title) {
          continue;
        }

        const goalStatus =
          goal.status ||
          "NOT_STARTED";

        const allowedGoalStatuses = [
          "NOT_STARTED",
          "IN_PROGRESS",
          "COMPLETED",
        ];

        if (
          !allowedGoalStatuses.includes(
            goalStatus,
          )
        ) {
          continue;
        }

        await client.query(
          `
            INSERT INTO performance_goals (
              performance_review_id,
              title,
              description,
              target,
              status
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5
            )
          `,
          [
            review.id,
            title,
            goal.description ||
              null,
            goal.target ||
              null,
            goalStatus,
          ],
        );
      }
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message:
        "Performance review created successfully",

      data: {
        id: Number(review.id),
        employeeId:
          Number(review.employee_id),
        reviewerId:
          review.reviewer_id
            ? Number(
                review.reviewer_id,
              )
            : null,
        reviewPeriodStart:
          review.review_period_start,
        reviewPeriodEnd:
          review.review_period_end,
        rating:
          review.rating === null
            ? null
            : Number(review.rating),
        status:
          review.status,
        companyId:
          Number(review.company_id),
        createdAt:
          review.created_at,
        updatedAt:
          review.updated_at,
      },
    });
  } catch (error) {
    await client.query(
      "ROLLBACK",
    );

    if (
      error?.code === "23505"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A performance review already exists for this employee and review period",
      });
    }

    if (
      error?.code === "23514"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One of the supplied performance review values is invalid",
      });
    }

    console.error(
      "Failed to create performance review:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create performance review",
    });
  } finally {
    client.release();
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/performance/:id/goals
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/goals",
  async (req, res) => {
    try {
      const reviewId =
        Number(req.params.id);

      if (!isValidId(reviewId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      const {
        title,
        description,
        target,
        status,
      } = req.body;

      const normalizedTitle =
        String(
          title ?? "",
        ).trim();

      if (!normalizedTitle) {
        return res.status(400).json({
          success: false,
          message:
            "Goal title is required",
        });
      }

      const allowedStatuses = [
        "NOT_STARTED",
        "IN_PROGRESS",
        "COMPLETED",
      ];

      const goalStatus =
        status || "NOT_STARTED";

      if (
        !allowedStatuses.includes(
          goalStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid goal status",
        });
      }

      /*
       * Validate review access first.
       */

      const reviewValues = [
        reviewId,
      ];

      const reviewConditions = [
        "pr.id = $1",
      ];

      addReviewScope(
        req,
        reviewValues,
        reviewConditions,
        "pr",
      );

      const reviewResult =
        await pool.query(
          `
            SELECT
              pr.id

            FROM performance_reviews pr

            WHERE ${reviewConditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          reviewValues,
        );

      if (
        reviewResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO performance_goals (
              performance_review_id,
              title,
              description,
              target,
              status
            )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5
            )

            RETURNING
              id,
              performance_review_id,
              title,
              description,
              target,
              status,
              created_at,
              updated_at
          `,
          [
            reviewId,
            normalizedTitle,
            description ||
              null,
            target ||
              null,
            goalStatus,
          ],
        );

      return res.status(201).json({
        success: true,
        message:
          "Performance goal created successfully",
        data:
          mapGoal(
            result.rows[0],
          ),
      });
    } catch (error) {
      if (
        error?.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A goal with this title already exists for this review",
        });
      }

      console.error(
        "Failed to create performance goal:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create performance goal",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| PUT /api/performance/:id
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  async (req, res) => {
    try {
      const reviewId =
        Number(req.params.id);

      if (!isValidId(reviewId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      const {
        employeeId,
        reviewerId,
        reviewPeriodStart,
        reviewPeriodEnd,
        rating,
        status,
      } = req.body;

      const values = [];
      const updates = [];

      /*
       * First verify review access.
       */

      const accessValues = [
        reviewId,
      ];

      const accessConditions = [
        "pr.id = $1",
      ];

      addReviewScope(
        req,
        accessValues,
        accessConditions,
        "pr",
      );

      const accessResult =
        await pool.query(
          `
            SELECT
              pr.id,
              pr.company_id

            FROM performance_reviews pr

            WHERE ${accessConditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          accessValues,
        );

      if (
        accessResult.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      /*
       * Employee.
       */

      if (
        employeeId !== undefined
      ) {
        const normalizedEmployeeId =
          Number(employeeId);

        if (
          !isValidId(
            normalizedEmployeeId,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid employee ID",
          });
        }

        const employeeValues = [
          normalizedEmployeeId,
        ];

        const employeeConditions = [
          "e.id = $1",
        ];

        if (!isSuperAdmin(req)) {
          const companyId =
            getCompanyId(req);

          if (companyId !== null) {
            employeeValues.push(
              companyId,
            );

            employeeConditions.push(
              `e.company_id = $${employeeValues.length}`,
            );
          }
        }

        const employeeResult =
          await pool.query(
            `
              SELECT
                e.id,
                e.company_id

              FROM employees e

              WHERE ${employeeConditions.join(
                " AND ",
              )}

              LIMIT 1
            `,
            employeeValues,
          );

        if (
          employeeResult.rows.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Employee not found or outside your company scope",
          });
        }

        values.push(
          normalizedEmployeeId,
        );

        updates.push(
          `employee_id = $${values.length}`,
        );

        /*
         * Keep company_id synchronized
         * when an administrator changes employee.
         */

        if (
          isSuperAdmin(req) &&
          employeeResult.rows[0]
            .company_id
        ) {
          values.push(
            employeeResult.rows[0]
              .company_id,
          );

          updates.push(
            `company_id = $${values.length}`,
          );
        }
      }

      /*
       * Reviewer.
       */

      if (
        reviewerId !== undefined
      ) {
        const normalizedReviewerId =
          reviewerId === null ||
          reviewerId === ""
            ? null
            : Number(reviewerId);

        if (
          normalizedReviewerId !== null &&
          !isValidId(
            normalizedReviewerId,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid reviewer ID",
          });
        }

        if (
          normalizedReviewerId !== null
        ) {
          const reviewerValues = [
            normalizedReviewerId,
          ];

          const reviewerConditions = [
            "e.id = $1",
          ];

          if (!isSuperAdmin(req)) {
            const companyId =
              getCompanyId(req);

            if (companyId !== null) {
              reviewerValues.push(
                companyId,
              );

              reviewerConditions.push(
                `e.company_id = $${reviewerValues.length}`,
              );
            }
          }

          const reviewerResult =
            await pool.query(
              `
                SELECT
                  e.id

                FROM employees e

                WHERE ${reviewerConditions.join(
                  " AND ",
                )}

                LIMIT 1
              `,
              reviewerValues,
            );

          if (
            reviewerResult.rows.length ===
            0
          ) {
            return res.status(404).json({
              success: false,
              message:
                "Reviewer not found or outside your company scope",
            });
          }
        }

        values.push(
          normalizedReviewerId,
        );

        updates.push(
          `reviewer_id = $${values.length}`,
        );
      }

      /*
       * Review period start.
       */

      if (
        reviewPeriodStart !==
        undefined
      ) {
        values.push(
          reviewPeriodStart,
        );

        updates.push(
          `review_period_start = $${values.length}`,
        );
      }

      /*
       * Review period end.
       */

      if (
        reviewPeriodEnd !==
        undefined
      ) {
        values.push(
          reviewPeriodEnd,
        );

        updates.push(
          `review_period_end = $${values.length}`,
        );
      }

      /*
       * Rating.
       */

      if (
        rating !== undefined
      ) {
        const normalizedRating =
          rating === "" ||
          rating === null
            ? null
            : Number(rating);

        if (
          normalizedRating !==
            null &&
          (!Number.isInteger(
            normalizedRating,
          ) ||
            normalizedRating < 1 ||
            normalizedRating > 5)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Rating must be between 1 and 5",
          });
        }

        values.push(
          normalizedRating,
        );

        updates.push(
          `rating = $${values.length}`,
        );
      }

      /*
       * Status.
       */

      if (
        status !== undefined
      ) {
        const allowedStatuses = [
          "DRAFT",
          "IN_REVIEW",
          "COMPLETED",
        ];

        if (
          !allowedStatuses.includes(
            status,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid performance review status",
          });
        }

        values.push(status);

        updates.push(
          `status = $${values.length}`,
        );
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No fields provided for update",
        });
      }

      /*
       * Review ID.
       */

      values.push(reviewId);

      const reviewIdParameter =
        `$${values.length}`;

      let whereClause =
        `id = ${reviewIdParameter}`;

      if (!isSuperAdmin(req)) {
        const companyId =
          getCompanyId(req);

        if (companyId !== null) {
          values.push(companyId);

          whereClause +=
            ` AND company_id = $${values.length}`;
        }
      }

      const result =
        await pool.query(
          `
            UPDATE performance_reviews

            SET
              ${updates.join(", ")},
              updated_at =
                CURRENT_TIMESTAMP

            WHERE ${whereClause}

            RETURNING
              id,
              employee_id,
              reviewer_id,
              review_period_start,
              review_period_end,
              rating,
              status,
              company_id,
              created_at,
              updated_at
          `,
          values,
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Performance review updated successfully",

        data: {
          id:
            Number(
              result.rows[0].id,
            ),

          employeeId:
            Number(
              result.rows[0]
                .employee_id,
            ),

          reviewerId:
            result.rows[0]
              .reviewer_id
              ? Number(
                  result.rows[0]
                    .reviewer_id,
                )
              : null,

          reviewPeriodStart:
            result.rows[0]
              .review_period_start,

          reviewPeriodEnd:
            result.rows[0]
              .review_period_end,

          rating:
            result.rows[0]
              .rating === null
              ? null
              : Number(
                  result.rows[0]
                    .rating,
                ),

          status:
            result.rows[0]
              .status,

          companyId:
            Number(
              result.rows[0]
                .company_id,
            ),

          createdAt:
            result.rows[0]
              .created_at,

          updatedAt:
            result.rows[0]
              .updated_at,
        },
      });
    } catch (error) {
      if (
        error?.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A performance review already exists for this employee and review period",
        });
      }

      if (
        error?.code === "23514"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One of the supplied performance review values is invalid",
        });
      }

      console.error(
        "Failed to update performance review:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update performance review",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| PUT /api/performance/:id/goals/:goalId
|--------------------------------------------------------------------------
*/

router.put(
  "/:id/goals/:goalId",
  async (req, res) => {
    try {
      const reviewId =
        Number(req.params.id);

      const goalId =
        Number(req.params.goalId);

      if (!isValidId(reviewId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      if (!isValidId(goalId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance goal ID",
        });
      }

      /*
       * Verify review access.
       */

      const accessValues = [
        reviewId,
      ];

      const accessConditions = [
        "pr.id = $1",
      ];

      addReviewScope(
        req,
        accessValues,
        accessConditions,
        "pr",
      );

      const accessResult =
        await pool.query(
          `
            SELECT
              pr.id

            FROM performance_reviews pr

            WHERE ${accessConditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          accessValues,
        );

      if (
        accessResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      const {
        title,
        description,
        target,
        status,
      } = req.body;

      const updates = [];
      const values = [];

      if (
        title !== undefined
      ) {
        const normalizedTitle =
          String(
            title ?? "",
          ).trim();

        if (!normalizedTitle) {
          return res.status(400).json({
            success: false,
            message:
              "Goal title is required",
          });
        }

        values.push(
          normalizedTitle,
        );

        updates.push(
          `title = $${values.length}`,
        );
      }

      if (
        description !==
        undefined
      ) {
        values.push(
          description || null,
        );

        updates.push(
          `description = $${values.length}`,
        );
      }

      if (
        target !== undefined
      ) {
        values.push(
          target || null,
        );

        updates.push(
          `target = $${values.length}`,
        );
      }

      if (
        status !== undefined
      ) {
        const allowedStatuses = [
          "NOT_STARTED",
          "IN_PROGRESS",
          "COMPLETED",
        ];

        if (
          !allowedStatuses.includes(
            status,
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid goal status",
          });
        }

        values.push(status);

        updates.push(
          `status = $${values.length}`,
        );
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No fields provided for goal update",
        });
      }

      values.push(goalId);

      const goalIdParameter =
        `$${values.length}`;

      values.push(reviewId);

      const reviewIdParameter =
        `$${values.length}`;

      const result =
        await pool.query(
          `
            UPDATE performance_goals

            SET
              ${updates.join(", ")},
              updated_at =
                CURRENT_TIMESTAMP

            WHERE
              id =
                ${goalIdParameter}

              AND performance_review_id =
                ${reviewIdParameter}

            RETURNING
              id,
              performance_review_id,
              title,
              description,
              target,
              status,
              created_at,
              updated_at
          `,
          values,
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance goal not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Performance goal updated successfully",
        data:
          mapGoal(
            result.rows[0],
          ),
      });
    } catch (error) {
      if (
        error?.code === "23505"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A goal with this title already exists for this review",
        });
      }

      console.error(
        "Failed to update performance goal:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update performance goal",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE /api/performance/:id/goals/:goalId
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id/goals/:goalId",
  async (req, res) => {
    try {
      const reviewId =
        Number(req.params.id);

      const goalId =
        Number(req.params.goalId);

      if (!isValidId(reviewId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      if (!isValidId(goalId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance goal ID",
        });
      }

      /*
       * Verify review access.
       */

      const accessValues = [
        reviewId,
      ];

      const accessConditions = [
        "pr.id = $1",
      ];

      addReviewScope(
        req,
        accessValues,
        accessConditions,
        "pr",
      );

      const accessResult =
        await pool.query(
          `
            SELECT
              pr.id

            FROM performance_reviews pr

            WHERE ${accessConditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          accessValues,
        );

      if (
        accessResult.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM performance_goals

            WHERE
              id = $1

              AND performance_review_id = $2

            RETURNING id
          `,
          [
            goalId,
            reviewId,
          ],
        );

      if (
        result.rows.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance goal not found",
        });
      }

      return res.json({
        success: true,
        message:
          "Performance goal deleted successfully",
      });
    } catch (error) {
      console.error(
        "Failed to delete performance goal:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete performance goal",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE /api/performance/:id
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const reviewId =
        Number(req.params.id);

      if (!isValidId(reviewId)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      await client.query("BEGIN");

      const values = [
        reviewId,
      ];

      const conditions = [
        "pr.id = $1",
      ];

      addReviewScope(
        req,
        values,
        conditions,
        "pr",
      );

      const reviewResult =
        await client.query(
          `
            SELECT
              pr.id

            FROM performance_reviews pr

            WHERE ${conditions.join(
              " AND ",
            )}

            LIMIT 1
          `,
          values,
        );

      if (
        reviewResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      /*
       * Delete goals first.
       */

      await client.query(
        `
          DELETE FROM performance_goals

          WHERE
            performance_review_id = $1
        `,
        [reviewId],
      );

      /*
       * Delete review.
       */

      const deleteResult =
        await client.query(
          `
            DELETE FROM performance_reviews

            WHERE
              id = $1

            RETURNING id
          `,
          [reviewId],
        );

      if (
        deleteResult.rows.length ===
        0
      ) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      await client.query("COMMIT");

      return res.json({
        success: true,
        message:
          "Performance review deleted successfully",
      });
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      console.error(
        "Failed to delete performance review:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete performance review",
      });
    } finally {
      client.release();
    }
  },
);

export default router;