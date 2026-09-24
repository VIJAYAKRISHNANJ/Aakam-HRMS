const express = require("express");
const { pool } = require("../db");
const {
  authenticateToken,
  authorizePermissions,
} = require("../middleware/auth.middleware");

const router = express.Router();

const addReviewScope = (req, values, conditions) => {
  if (req.user.role !== "SUPER_ADMINISTRATOR") {
    values.push(req.user.requestedCompanyId);
    conditions.push(`pr.company_id = $${values.length}`);
  }

  if (req.user.role === "EMPLOYEE") {
    values.push(req.user.employee_id);
    conditions.push(`pr.employee_id = $${values.length}`);
  }

  if (req.user.role === "MANAGER") {
    values.push(req.user.employee_id);
    conditions.push(`pr.reviewer_id = $${values.length}`);
  }
};

router.use(authenticateToken);

router.use("/:id", async (req, res, next) => {
  const reviewId = Number(req.params.id);

  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return res.status(400).json({ message: "Invalid review ID" });
  }

  try {
    const values = [reviewId];
    const conditions = ["pr.id = $1"];

    addReviewScope(req, values, conditions);

    const result = await pool.query(
      `
        SELECT pr.id
        FROM performance_reviews pr
        WHERE ${conditions.join(" AND ")}
        LIMIT 1
      `,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Performance review not found" });
    }

    next();
  } catch (error) {
    console.error("Performance review scope error:", error);
    return res.status(500).json({
      message: "Failed to validate performance review access",
    });
  }
});

router.get(
  "/",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`pr.company_id = $${values.length}`);
      }

      if (req.user.role === "EMPLOYEE") {
        values.push(req.user.employee_id);
        conditions.push(`pr.employee_id = $${values.length}`);
      }

      if (req.user.role === "MANAGER") {
        values.push(req.user.employee_id);
        conditions.push(`pr.reviewer_id = $${values.length}`);
      }

      if (req.query.employeeId) {
        const employeeId = Number(req.query.employeeId);

        if (!Number.isInteger(employeeId) || employeeId <= 0) {
          return res.status(400).json({
            message: "Invalid employee ID",
          });
        }

        values.push(employeeId);
        conditions.push(`pr.employee_id = $${values.length}`);
      }

      if (req.query.status) {
        values.push(String(req.query.status));
        conditions.push(`pr.status = $${values.length}`);
      }

      if (req.query.reviewType) {
        values.push(String(req.query.reviewType));
        conditions.push(`pr.review_type = $${values.length}`);
      }

      if (req.query.startDate) {
        values.push(String(req.query.startDate));
        conditions.push(`pr.review_date >= $${values.length}`);
      }

      if (req.query.endDate) {
        values.push(String(req.query.endDate));
        conditions.push(`pr.review_date <= $${values.length}`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const result = await pool.query(
        `
          SELECT
            pr.*,
            e.employee_code,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.email AS employee_email,
            d.name AS department_name,
            reviewer.first_name AS reviewer_first_name,
            reviewer.last_name AS reviewer_last_name
          FROM performance_reviews pr
          LEFT JOIN employees e
            ON e.id = pr.employee_id
          LEFT JOIN departments d
            ON d.id = e.department_id
          LEFT JOIN employees reviewer
            ON reviewer.id = pr.reviewer_id
          ${whereClause}
          ORDER BY pr.review_date DESC, pr.id DESC
        `,
        values,
      );

      return res.json(result.rows);
    } catch (error) {
      console.error("Failed to list performance reviews:", error);
      return res.status(500).json({
        message: "Failed to load performance reviews",
      });
    }
  },
);

router.get(
  "/summary",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`pr.company_id = $${values.length}`);
      }

      if (req.user.role === "EMPLOYEE") {
        values.push(req.user.employee_id);
        conditions.push(`pr.employee_id = $${values.length}`);
      }

      if (req.user.role === "MANAGER") {
        values.push(req.user.employee_id);
        conditions.push(`pr.reviewer_id = $${values.length}`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
              WHERE pr.status = 'IN_PROGRESS'
            )::INTEGER AS in_progress_reviews,
            ROUND(
              AVG(pr.overall_rating)::NUMERIC,
              2
            ) AS average_rating
          FROM performance_reviews pr
          ${whereClause}
        `,
        values,
      );

      return res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to load performance summary:", error);
      return res.status(500).json({
        message: "Failed to load performance summary",
      });
    }
  },
);

router.get(
  "/employees",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = ["e.employment_status = 'ACTIVE'"];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`e.company_id = $${values.length}`);
      }

      if (req.user.role === "EMPLOYEE") {
        values.push(req.user.employee_id);
        conditions.push(`e.id = $${values.length}`);
      }

      if (req.user.role === "MANAGER") {
        values.push(req.user.employee_id);
        conditions.push(`e.reporting_manager_id = $${values.length}`);
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

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
          ${whereClause}
          ORDER BY e.first_name, e.last_name
        `,
        values,
      );

      return res.json(result.rows);
    } catch (error) {
      console.error("Failed to load performance employees:", error);
      return res.status(500).json({
        message: "Failed to load employees",
      });
    }
  },
);

router.get(
  "/reviewers",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = ["e.employment_status = 'ACTIVE'"];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`e.company_id = $${values.length}`);
      }

      const result = await pool.query(
        `
          SELECT
            e.id,
            e.employee_code,
            e.first_name,
            e.last_name,
            e.email,
            e.designation
          FROM employees e
          ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
          ORDER BY e.first_name, e.last_name
        `,
        values,
      );

      return res.json(result.rows);
    } catch (error) {
      console.error("Failed to load performance reviewers:", error);
      return res.status(500).json({
        message: "Failed to load reviewers",
      });
    }
  },
);

router.get(
  "/:id",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);

      const values = [reviewId];
      const conditions = ["pr.id = $1"];

      addReviewScope(req, values, conditions);

      const result = await pool.query(
        `
          SELECT
            pr.*,
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
          LEFT JOIN employees e
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
          message: "Performance review not found",
        });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error("Failed to load performance review:", error);
      return res.status(500).json({
        message: "Failed to load performance review",
      });
    }
  },
);

router.get(
  "/:id/goals",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);

      const result = await pool.query(
        `
          SELECT
            pg.*,
            e.employee_code,
            e.first_name,
            e.last_name
          FROM performance_goals pg
          LEFT JOIN employees e
            ON e.id = pg.employee_id
          WHERE pg.performance_review_id = $1
          ORDER BY pg.created_at DESC, pg.id DESC
        `,
        [reviewId],
      );

      return res.json(result.rows);
    } catch (error) {
      console.error("Failed to load performance goals:", error);
      return res.status(500).json({
        message: "Failed to load performance goals",
      });
    }
  },
);

router.post(
  "/",
  authorizePermissions("performance.create"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const {
        employeeId,
        reviewerId,
        reviewType,
        reviewDate,
        periodStart,
        periodEnd,
        status,
        overallRating,
        strengths,
        areasForImprovement,
        comments,
        goals,
      } = req.body;

      const normalizedEmployeeId = Number(employeeId);
      const normalizedReviewerId = reviewerId
        ? Number(reviewerId)
        : null;

      if (
        !Number.isInteger(normalizedEmployeeId) ||
        normalizedEmployeeId <= 0
      ) {
        return res.status(400).json({
          message: "Valid employee ID is required",
        });
      }

      if (
        normalizedReviewerId !== null &&
        (!Number.isInteger(normalizedReviewerId) ||
          normalizedReviewerId <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid reviewer ID",
        });
      }

      await client.query("BEGIN");

      const employeeValues = [normalizedEmployeeId];
      const employeeConditions = ["e.id = $1"];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        employeeValues.push(req.user.requestedCompanyId);
        employeeConditions.push(
          `e.company_id = $${employeeValues.length}`,
        );
      }

      const employeeResult = await client.query(
        `
          SELECT
            e.id,
            e.company_id
          FROM employees e
          WHERE ${employeeConditions.join(" AND ")}
          LIMIT 1
        `,
        employeeValues,
      );

      if (employeeResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Employee not found or outside your company scope",
        });
      }

      const employeeCompanyId = employeeResult.rows[0].company_id;

      if (!employeeCompanyId) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Employee is not assigned to a company",
        });
      }

      let reviewerEmployee = null;

      if (normalizedReviewerId !== null) {
        const reviewerValues = [normalizedReviewerId];
        const reviewerConditions = ["e.id = $1"];

        if (req.user.role !== "SUPER_ADMINISTRATOR") {
          reviewerValues.push(req.user.requestedCompanyId);
          reviewerConditions.push(
            `e.company_id = $${reviewerValues.length}`,
          );
        }

        const reviewerResult = await client.query(
          `
            SELECT
              e.id,
              e.company_id
            FROM employees e
            WHERE ${reviewerConditions.join(" AND ")}
            LIMIT 1
          `,
          reviewerValues,
        );

        if (reviewerResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({
            message: "Reviewer not found or outside your company scope",
          });
        }

        reviewerEmployee = reviewerResult.rows[0];
      }

      const insertValues = [
        normalizedEmployeeId,
        normalizedReviewerId,
        reviewType || null,
        reviewDate || null,
        periodStart || null,
        periodEnd || null,
        status || "DRAFT",
        overallRating ?? null,
        strengths || null,
        areasForImprovement || null,
        comments || null,
        employeeCompanyId,
      ];

      const insertResult = await client.query(
        `
          INSERT INTO performance_reviews (
            employee_id,
            reviewer_id,
            review_type,
            review_date,
            period_start,
            period_end,
            status,
            overall_rating,
            strengths,
            areas_for_improvement,
            comments,
            company_id
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
            $12
          )
          RETURNING id
        `,
        insertValues,
      );

      const reviewId = insertResult.rows[0].id;

      if (Array.isArray(goals)) {
        for (const goal of goals) {
          if (!goal || typeof goal !== "object") {
            continue;
          }

          await client.query(
            `
              INSERT INTO performance_goals (
                performance_review_id,
                employee_id,
                title,
                description,
                target_date,
                status,
                progress,
                notes
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
              reviewId,
              normalizedEmployeeId,
              goal.title || null,
              goal.description || null,
              goal.targetDate || null,
              goal.status || "NOT_STARTED",
              goal.progress ?? 0,
              goal.notes || null,
            ],
          );
        }
      }

      await client.query("COMMIT");

      return res.status(201).json({
        message: "Performance review created successfully",
        id: reviewId,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Failed to create performance review:", error);

      return res.status(500).json({
        message: "Failed to create performance review",
      });
    } finally {
      client.release();
    }
  },
);

router.post(
  "/:id/goals",
  authorizePermissions("performance.update"),
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);
      const {
        title,
        description,
        targetDate,
        status,
        progress,
        notes,
      } = req.body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({
          message: "Goal title is required",
        });
      }

      const reviewResult = await pool.query(
        `
          SELECT employee_id
          FROM performance_reviews
          WHERE id = $1
          LIMIT 1
        `,
        [reviewId],
      );

      if (reviewResult.rows.length === 0) {
        return res.status(404).json({
          message: "Performance review not found",
        });
      }

      const employeeId = reviewResult.rows[0].employee_id;

      const result = await pool.query(
        `
          INSERT INTO performance_goals (
            performance_review_id,
            employee_id,
            title,
            description,
            target_date,
            status,
            progress,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        [
          reviewId,
          employeeId,
          String(title).trim(),
          description || null,
          targetDate || null,
          status || "NOT_STARTED",
          progress ?? 0,
          notes || null,
        ],
      );

      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Failed to create performance goal:", error);
      return res.status(500).json({
        message: "Failed to create performance goal",
      });
    }
  },
);
router.put(
  "/:id",
  authorizePermissions("performance.update"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const reviewId = Number(req.params.id);

      if (!Number.isInteger(reviewId) || reviewId <= 0) {
        return res.status(400).json({
          message: "Invalid review ID",
        });
      }

      const {
        employeeId,
        reviewerId,
        reviewType,
        reviewDate,
        periodStart,
        periodEnd,
        status,
        overallRating,
        strengths,
        areasForImprovement,
        comments,
      } = req.body;

      const normalizedEmployeeId =
        employeeId !== undefined && employeeId !== null
          ? Number(employeeId)
          : null;

      const normalizedReviewerId =
        reviewerId !== undefined &&
        reviewerId !== null &&
        reviewerId !== ""
          ? Number(reviewerId)
          : null;

      if (
        normalizedEmployeeId !== null &&
        (!Number.isInteger(normalizedEmployeeId) ||
          normalizedEmployeeId <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid employee ID",
        });
      }

      if (
        normalizedReviewerId !== null &&
        (!Number.isInteger(normalizedReviewerId) ||
          normalizedReviewerId <= 0)
      ) {
        return res.status(400).json({
          message: "Invalid reviewer ID",
        });
      }

      await client.query("BEGIN");

      const existingValues = [reviewId];
      const existingConditions = ["pr.id = $1"];

      addReviewScope(req, existingValues, existingConditions);

      const existingResult = await client.query(
        `
          SELECT
            pr.id,
            pr.employee_id,
            pr.reviewer_id,
            pr.company_id
          FROM performance_reviews pr
          WHERE ${existingConditions.join(" AND ")}
          LIMIT 1
        `,
        existingValues,
      );

      if (existingResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Performance review not found",
        });
      }

      const existingReview = existingResult.rows[0];

      let updatedEmployeeCompanyId = null;

      if (normalizedEmployeeId !== null) {
        const employeeValues = [normalizedEmployeeId];
        const employeeConditions = ["e.id = $1"];

        if (req.user.role !== "SUPER_ADMINISTRATOR") {
          employeeValues.push(req.user.requestedCompanyId);
          employeeConditions.push(
            `e.company_id = $${employeeValues.length}`,
          );
        }

        const employeeResult = await client.query(
          `
            SELECT
              e.id,
              e.company_id
            FROM employees e
            WHERE ${employeeConditions.join(" AND ")}
            LIMIT 1
          `,
          employeeValues,
        );

        if (employeeResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return res.status(404).json({
            message: "Employee not found or outside your company scope",
          });
        }

        updatedEmployeeCompanyId =
          employeeResult.rows[0].company_id;

        if (!updatedEmployeeCompanyId) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message: "Employee is not assigned to a company",
          });
        }
      }

      if (normalizedReviewerId !== null) {
        const reviewerValues = [normalizedReviewerId];
        const reviewerConditions = ["e.id = $1"];

        if (req.user.role !== "SUPER_ADMINISTRATOR") {
          reviewerValues.push(req.user.requestedCompanyId);
          reviewerConditions.push(
            `e.company_id = $${reviewerValues.length}`,
          );
        }

        const reviewerResult = await client.query(
          `
            SELECT
              e.id,
              e.company_id
            FROM employees e
            WHERE ${reviewerConditions.join(" AND ")}
            LIMIT 1
          `,
          reviewerValues,
        );

        if (reviewerResult.rows.length === 0) {
          await client.query("ROLLBACK");

          return res.status(404).json({
            message: "Reviewer not found or outside your company scope",
          });
        }
      }

      const updates = [];
      const values = [];

      const addUpdate = (expression, value) => {
        values.push(value);
        updates.push(`${expression} = $${values.length}`);
      };

      if (normalizedEmployeeId !== null) {
        addUpdate("employee_id", normalizedEmployeeId);
      }

      if (reviewerId !== undefined) {
        addUpdate("reviewer_id", normalizedReviewerId);
      }

      if (reviewType !== undefined) {
        addUpdate("review_type", reviewType || null);
      }

      if (reviewDate !== undefined) {
        addUpdate("review_date", reviewDate || null);
      }

      if (periodStart !== undefined) {
        addUpdate("period_start", periodStart || null);
      }

      if (periodEnd !== undefined) {
        addUpdate("period_end", periodEnd || null);
      }

      if (status !== undefined) {
        addUpdate("status", status || null);
      }

      if (overallRating !== undefined) {
        addUpdate("overall_rating", overallRating ?? null);
      }

      if (strengths !== undefined) {
        addUpdate("strengths", strengths || null);
      }

      if (areasForImprovement !== undefined) {
        addUpdate(
          "areas_for_improvement",
          areasForImprovement || null,
        );
      }

      if (comments !== undefined) {
        addUpdate("comments", comments || null);
      }

      if (
        req.user.role === "SUPER_ADMINISTRATOR" &&
        updatedEmployeeCompanyId
      ) {
        addUpdate("company_id", updatedEmployeeCompanyId);
      }

      if (updates.length === 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "No fields provided for update",
        });
      }

      values.push(reviewId);
      const reviewIdParameter = `$${values.length}`;

      let whereClause = `id = ${reviewIdParameter}`;

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        whereClause += ` AND company_id = $${values.length}`;
      }

      const updateResult = await client.query(
        `
          UPDATE performance_reviews
          SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
          WHERE ${whereClause}
          RETURNING *
        `,
        values,
      );

      if (updateResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Performance review not found",
        });
      }

      await client.query("COMMIT");

      return res.json({
        message: "Performance review updated successfully",
        review: updateResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Failed to update performance review:", error);

      return res.status(500).json({
        message: "Failed to update performance review",
      });
    } finally {
      client.release();
    }
  },
);

router.delete(
  "/:id",
  authorizePermissions("performance.delete"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const reviewId = Number(req.params.id);

      if (!Number.isInteger(reviewId) || reviewId <= 0) {
        return res.status(400).json({
          message: "Invalid review ID",
        });
      }

      await client.query("BEGIN");

      const values = [reviewId];
      const conditions = ["pr.id = $1"];

      addReviewScope(req, values, conditions);

      const existingResult = await client.query(
        `
          SELECT pr.id
          FROM performance_reviews pr
          WHERE ${conditions.join(" AND ")}
          LIMIT 1
        `,
        values,
      );

      if (existingResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Performance review not found",
        });
      }

      await client.query(
        `
          DELETE FROM performance_goals
          WHERE performance_review_id = $1
        `,
        [reviewId],
      );

      const deleteValues = [reviewId];
      let deleteWhere = "id = $1";

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        deleteValues.push(req.user.requestedCompanyId);
        deleteWhere += ` AND company_id = $${deleteValues.length}`;
      }

      const deleteResult = await client.query(
        `
          DELETE FROM performance_reviews
          WHERE ${deleteWhere}
          RETURNING id
        `,
        deleteValues,
      );

      if (deleteResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Performance review not found",
        });
      }

      await client.query("COMMIT");

      return res.json({
        message: "Performance review deleted successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Failed to delete performance review:", error);

      return res.status(500).json({
        message: "Failed to delete performance review",
      });
    } finally {
      client.release();
    }
  },
);

router.put(
  "/:id/goals/:goalId",
  authorizePermissions("performance.update"),
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);
      const goalId = Number(req.params.goalId);

      if (
        !Number.isInteger(reviewId) ||
        reviewId <= 0 ||
        !Number.isInteger(goalId) ||
        goalId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid review or goal ID",
        });
      }

      const {
        title,
        description,
        targetDate,
        status,
        progress,
        notes,
      } = req.body;

      const updates = [];
      const values = [];

      const addUpdate = (expression, value) => {
        values.push(value);
        updates.push(`${expression} = $${values.length}`);
      };

      if (title !== undefined) {
        addUpdate("title", title || null);
      }

      if (description !== undefined) {
        addUpdate("description", description || null);
      }

      if (targetDate !== undefined) {
        addUpdate("target_date", targetDate || null);
      }

      if (status !== undefined) {
        addUpdate("status", status || null);
      }

      if (progress !== undefined) {
        addUpdate("progress", progress ?? 0);
      }

      if (notes !== undefined) {
        addUpdate("notes", notes || null);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          message: "No fields provided for update",
        });
      }

      values.push(goalId);
      const goalIdParameter = `$${values.length}`;

      values.push(reviewId);
      const reviewIdParameter = `$${values.length}`;

      const result = await pool.query(
        `
          UPDATE performance_goals
          SET
            ${updates.join(", ")},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${goalIdParameter}
            AND performance_review_id = ${reviewIdParameter}
          RETURNING *
        `,
        values,
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Performance goal not found",
        });
      }

      return res.json({
        message: "Performance goal updated successfully",
        goal: result.rows[0],
      });
    } catch (error) {
      console.error("Failed to update performance goal:", error);

      return res.status(500).json({
        message: "Failed to update performance goal",
      });
    }
  },
);

router.delete(
  "/:id/goals/:goalId",
  authorizePermissions("performance.update"),
  async (req, res) => {
    try {
      const reviewId = Number(req.params.id);
      const goalId = Number(req.params.goalId);

      if (
        !Number.isInteger(reviewId) ||
        reviewId <= 0 ||
        !Number.isInteger(goalId) ||
        goalId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid review or goal ID",
        });
      }

      const result = await pool.query(
        `
          DELETE FROM performance_goals
          WHERE id = $1
            AND performance_review_id = $2
          RETURNING id
        `,
        [goalId, reviewId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Performance goal not found",
        });
      }

      return res.json({
        message: "Performance goal deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete performance goal:", error);

      return res.status(500).json({
        message: "Failed to delete performance goal",
      });
    }
  },
);

router.get(
  "/analytics/ratings",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`pr.company_id = $${values.length}`);
      }

      if (req.user.role === "EMPLOYEE") {
        values.push(req.user.employee_id);
        conditions.push(`pr.employee_id = $${values.length}`);
      }

      if (req.user.role === "MANAGER") {
        values.push(req.user.employee_id);
        conditions.push(`pr.reviewer_id = $${values.length}`);
      }

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(" AND ")}`
          : "";

      const result = await pool.query(
        `
          SELECT
            pr.overall_rating,
            COUNT(*)::INTEGER AS count
          FROM performance_reviews pr
          ${whereClause}
          GROUP BY pr.overall_rating
          ORDER BY pr.overall_rating
        `,
        values,
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(
        "Failed to load performance rating analytics:",
        error,
      );

      return res.status(500).json({
        message: "Failed to load performance rating analytics",
      });
    }
  },
);

router.get(
  "/analytics/departments",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`pr.company_id = $${values.length}`);
      }

      if (req.user.role === "EMPLOYEE") {
        values.push(req.user.employee_id);
        conditions.push(`pr.employee_id = $${values.length}`);
      }

      if (req.user.role === "MANAGER") {
        values.push(req.user.employee_id);
        conditions.push(`pr.reviewer_id = $${values.length}`);
      }

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
              AVG(pr.overall_rating)::NUMERIC,
              2
            ) AS average_rating
          FROM performance_reviews pr
          INNER JOIN employees e
            ON e.id = pr.employee_id
          LEFT JOIN departments d
            ON d.id = e.department_id
          ${whereClause}
          GROUP BY d.id, d.name
          ORDER BY d.name
        `,
        values,
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(
        "Failed to load performance department analytics:",
        error,
      );

      return res.status(500).json({
        message: "Failed to load performance department analytics",
      });
    }
  },
);

router.get(
  "/analytics/status",
  authorizePermissions("performance.view"),
  async (req, res) => {
    try {
      const values = [];
      const conditions = [];

      if (req.user.role !== "SUPER_ADMINISTRATOR") {
        values.push(req.user.requestedCompanyId);
        conditions.push(`pr.company_id = $${values.length}`);
      }

      if (req.user.role === "EMPLOYEE") {
        values.push(req.user.employee_id);
        conditions.push(`pr.employee_id = $${values.length}`);
      }

      if (req.user.role === "MANAGER") {
        values.push(req.user.employee_id);
        conditions.push(`pr.reviewer_id = $${values.length}`);
      }

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
          GROUP BY pr.status
          ORDER BY pr.status
        `,
        values,
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(
        "Failed to load performance status analytics:",
        error,
      );

      return res.status(500).json({
        message: "Failed to load performance status analytics",
      });
    }
  },
);

module.exports = router;