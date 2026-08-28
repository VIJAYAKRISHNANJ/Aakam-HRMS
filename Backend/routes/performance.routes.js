import express from "express";
import pool from "../db.js";

const router = express.Router();

const REVIEW_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "COMPLETED",
];

const GOAL_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
];

const isValidId = (value) =>
  /^\d+$/.test(String(value)) &&
  Number(value) > 0;

const isValidDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const isValidRating = (value) =>
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 5;

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) {
    return value;
  }

  const year = value.getFullYear();

  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const mapGoal = (goal) => ({
  id: Number(goal.id),

  performanceReviewId:
    Number(goal.performance_review_id),

  title: goal.title,

  description:
    goal.description,

  target:
    goal.target,

  status:
    goal.status,

  createdAt:
    goal.created_at,

  updatedAt:
    goal.updated_at,
});

const mapReview = (review) => ({
  id: Number(review.id),

  employeeId:
    Number(review.employee_id),

  employeeCode:
    review.employee_code,

  employeeName:
    `${review.first_name} ${
      review.last_name ?? ""
    }`.trim(),

  departmentId:
    review.department_id
      ? Number(review.department_id)
      : null,

  department:
    review.department_name ??
    "Unassigned",

  reviewerId:
    review.reviewer_id
      ? Number(review.reviewer_id)
      : null,

  reviewerName:
    review.reviewer_id
      ? `${review.reviewer_first_name} ${
          review.reviewer_last_name ?? ""
        }`.trim()
      : null,

  reviewPeriodStart:
    formatDateOnly(
      review.review_period_start,
    ),

  reviewPeriodEnd:
    formatDateOnly(
      review.review_period_end,
    ),

  rating:
    review.rating === null
      ? null
      : Number(review.rating),

  status:
    review.status,

  goals:
    (review.goals ?? []).map(mapGoal),

  createdAt:
    review.created_at,

  updatedAt:
    review.updated_at,
});

/* -------------------------------------------------------------------------- */
/* Review SELECT                                                              */
/* -------------------------------------------------------------------------- */

const reviewSelect = `
  SELECT
    pr.id,
    pr.employee_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.department_id,
    d.name AS department_name,

    pr.reviewer_id,

    reviewer.first_name AS reviewer_first_name,
    reviewer.last_name AS reviewer_last_name,

    pr.review_period_start,
    pr.review_period_end,
    pr.rating,
    pr.status,
    pr.created_at,
    pr.updated_at,

    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id',
          pg.id,

          'performance_review_id',
          pg.performance_review_id,

          'title',
          pg.title,

          'description',
          pg.description,

          'target',
          pg.target,

          'status',
          pg.status,

          'created_at',
          pg.created_at,

          'updated_at',
          pg.updated_at
        )
        ORDER BY pg.id
      )
      FILTER (
        WHERE pg.id IS NOT NULL
      ),
      '[]'::json
    ) AS goals

  FROM performance_reviews pr

  INNER JOIN employees e
    ON e.id = pr.employee_id

  LEFT JOIN departments d
    ON d.id = e.department_id

  LEFT JOIN employees reviewer
    ON reviewer.id = pr.reviewer_id

  LEFT JOIN performance_goals pg
    ON pg.performance_review_id = pr.id
`;

/* -------------------------------------------------------------------------- */
/* GROUP BY                                                                   */
/* -------------------------------------------------------------------------- */

const reviewGroup = `
  GROUP BY
    pr.id,
    pr.employee_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.department_id,
    d.name,
    pr.reviewer_id,
    reviewer.first_name,
    reviewer.last_name,
    pr.review_period_start,
    pr.review_period_end,
    pr.rating,
    pr.status,
    pr.created_at,
    pr.updated_at
`;

/* -------------------------------------------------------------------------- */
/* Get Single Review                                                          */
/* -------------------------------------------------------------------------- */

const getReview = async (id) => {
  const result = await pool.query(
    `${reviewSelect}
     WHERE pr.id = $1
     ${reviewGroup};`,
    [id],
  );

  return result.rows[0];
};

/* -------------------------------------------------------------------------- */
/* Validate Review                                                            */
/* -------------------------------------------------------------------------- */

const validateReview = (
  {
    employeeId,
    reviewerId,
    reviewPeriodStart,
    reviewPeriodEnd,
    rating,
    status,
  },
  partial = false,
) => {
  if (
    (!partial ||
      employeeId !== undefined) &&
    !isValidId(employeeId)
  ) {
    return "Valid employee ID is required";
  }

  if (
    reviewerId !== undefined &&
    reviewerId !== null &&
    !isValidId(reviewerId)
  ) {
    return "Reviewer ID must be valid";
  }

  if (
    (!partial ||
      reviewPeriodStart !== undefined) &&
    !isValidDate(reviewPeriodStart)
  ) {
    return "Review period start must be a valid date in YYYY-MM-DD format";
  }

  if (
    (!partial ||
      reviewPeriodEnd !== undefined) &&
    !isValidDate(reviewPeriodEnd)
  ) {
    return "Review period end must be a valid date in YYYY-MM-DD format";
  }

  if (
    reviewPeriodStart !== undefined &&
    reviewPeriodEnd !== undefined &&
    isValidDate(reviewPeriodStart) &&
    isValidDate(reviewPeriodEnd) &&
    reviewPeriodStart > reviewPeriodEnd
  ) {
    return "Review period start cannot be after the end date";
  }

  if (
    rating !== undefined &&
    rating !== null &&
    !isValidRating(rating)
  ) {
    return "Rating must be an integer from 1 to 5";
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !REVIEW_STATUSES.includes(
        status.toUpperCase(),
      )
    )
  ) {
    return "Invalid performance review status";
  }

  return null;
};

/* -------------------------------------------------------------------------- */
/* Validate Goal                                                              */
/* -------------------------------------------------------------------------- */

const validateGoal = (
  { title, status },
  partial = false,
) => {
  if (
    (!partial ||
      title !== undefined) &&
    (
      typeof title !== "string" ||
      !title.trim()
    )
  ) {
    return "Goal title is required";
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !GOAL_STATUSES.includes(
        status.toUpperCase(),
      )
    )
  ) {
    return "Invalid goal status";
  }

  return null;
};

/* -------------------------------------------------------------------------- */
/* Performance Reviews - List                                                 */
/* -------------------------------------------------------------------------- */

router.get("/", async (req, res) => {
  try {
    const {
      employeeId = "",
      departmentId = "",
      status = "",
      reviewPeriodStart = "",
      reviewPeriodEnd = "",
    } = req.query;

    const values = [];
    const conditions = [];

    if (employeeId) {
      if (!isValidId(employeeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      values.push(Number(employeeId));

      conditions.push(
        `pr.employee_id = $${values.length}`,
      );
    }

    if (departmentId) {
      if (!isValidId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      values.push(Number(departmentId));

      conditions.push(
        `e.department_id = $${values.length}`,
      );
    }

    if (status) {
      const normalizedStatus =
        status.toUpperCase();

      if (
        !REVIEW_STATUSES.includes(
          normalizedStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review status",
        });
      }

      values.push(normalizedStatus);

      conditions.push(
        `pr.status = $${values.length}`,
      );
    }

    if (reviewPeriodStart) {
      if (
        !isValidDate(reviewPeriodStart)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid review period start",
        });
      }

      values.push(reviewPeriodStart);

      conditions.push(
        `pr.review_period_start = $${values.length}`,
      );
    }

    if (reviewPeriodEnd) {
      if (
        !isValidDate(reviewPeriodEnd)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid review period end",
        });
      }

      values.push(reviewPeriodEnd);

      conditions.push(
        `pr.review_period_end = $${values.length}`,
      );
    }

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `${reviewSelect}
       ${whereClause}
       ${reviewGroup}
       ORDER BY
         pr.review_period_end DESC,
         pr.id DESC;`,
      values,
    );

    res.json({
      success: true,
      data: result.rows.map(mapReview),
      total: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Performance list error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load performance reviews",
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Performance Review - Details                                               */
/* -------------------------------------------------------------------------- */

router.get(
  "/:id",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      const review =
        await getReview(
          req.params.id,
        );

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      res.json({
        success: true,
        data: mapReview(review),
      });
    } catch (error) {
      console.error(
        "Performance detail error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load performance review",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Performance Review - Create                                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  async (req, res) => {
    try {
      const {
        employeeId,
        reviewerId = null,
        reviewPeriodStart,
        reviewPeriodEnd,
        rating = null,
        status = "DRAFT",
      } = req.body;

      const normalizedStatus =
        typeof status === "string"
          ? status.toUpperCase()
          : status;

      const validationError =
        validateReview({
          employeeId,
          reviewerId,
          reviewPeriodStart,
          reviewPeriodEnd,
          rating,
          status: normalizedStatus,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const employee =
        await pool.query(
          `SELECT id
           FROM employees
           WHERE id = $1
           LIMIT 1;`,
          [employeeId],
        );

      if (!employee.rows.length) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      if (reviewerId !== null) {
        const reviewer =
          await pool.query(
            `SELECT id
             FROM employees
             WHERE id = $1
             LIMIT 1;`,
            [reviewerId],
          );

        if (!reviewer.rows.length) {
          return res.status(404).json({
            success: false,
            message: "Reviewer not found",
          });
        }
      }

      const result =
        await pool.query(
          `INSERT INTO performance_reviews
            (
              employee_id,
              reviewer_id,
              review_period_start,
              review_period_end,
              rating,
              status
            )
           VALUES
            (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )
           RETURNING id;`,
          [
            employeeId,
            reviewerId,
            reviewPeriodStart,
            reviewPeriodEnd,
            rating,
            normalizedStatus,
          ],
        );

      res.status(201).json({
        success: true,
        message:
          "Performance review created successfully",
        data: mapReview(
          await getReview(
            result.rows[0].id,
          ),
        ),
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A performance review already exists for this employee and review period",
        });
      }

      console.error(
        "Performance creation error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create performance review",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Performance Review - Update                                                */
/* -------------------------------------------------------------------------- */

router.put(
  "/:id",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      const existing =
        await getReview(
          req.params.id,
        );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
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

      const normalizedStatus =
        typeof status === "string"
          ? status.toUpperCase()
          : status;

      const validationError =
        validateReview(
          {
            employeeId,
            reviewerId,
            reviewPeriodStart,
            reviewPeriodEnd,
            rating,
            status: normalizedStatus,
          },
          true,
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      if (
        employeeId !== undefined
      ) {
        const employee =
          await pool.query(
            `SELECT id
             FROM employees
             WHERE id = $1
             LIMIT 1;`,
            [employeeId],
          );

        if (!employee.rows.length) {
          return res.status(404).json({
            success: false,
            message: "Employee not found",
          });
        }
      }

      if (
        reviewerId !== undefined &&
        reviewerId !== null
      ) {
        const reviewer =
          await pool.query(
            `SELECT id
             FROM employees
             WHERE id = $1
             LIMIT 1;`,
            [reviewerId],
          );

        if (!reviewer.rows.length) {
          return res.status(404).json({
            success: false,
            message: "Reviewer not found",
          });
        }
      }

      const updates = [];
      const values = [];

      const addUpdate = (
        column,
        value,
      ) => {
        values.push(value);

        updates.push(
          `${column} = $${values.length}`,
        );
      };

      if (
        employeeId !== undefined
      ) {
        addUpdate(
          "employee_id",
          employeeId,
        );
      }

      if (
        reviewerId !== undefined
      ) {
        addUpdate(
          "reviewer_id",
          reviewerId,
        );
      }

      if (
        reviewPeriodStart !== undefined
      ) {
        addUpdate(
          "review_period_start",
          reviewPeriodStart,
        );
      }

      if (
        reviewPeriodEnd !== undefined
      ) {
        addUpdate(
          "review_period_end",
          reviewPeriodEnd,
        );
      }

      if (rating !== undefined) {
        addUpdate(
          "rating",
          rating,
        );
      }

      if (
        normalizedStatus !== undefined
      ) {
        addUpdate(
          "status",
          normalizedStatus,
        );
      }

      if (!updates.length) {
        return res.status(400).json({
          success: false,
          message:
            "At least one field is required",
        });
      }

      updates.push(
        "updated_at = CURRENT_TIMESTAMP",
      );

      values.push(req.params.id);

      await pool.query(
        `UPDATE performance_reviews
         SET ${updates.join(", ")}
         WHERE id = $${values.length};`,
        values,
      );

      res.json({
        success: true,
        message:
          "Performance review updated successfully",
        data: mapReview(
          await getReview(
            req.params.id,
          ),
        ),
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A performance review already exists for this employee and review period",
        });
      }

      console.error(
        "Performance update error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update performance review",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Goals - List                                                               */
/* -------------------------------------------------------------------------- */

router.get(
  "/:id/goals",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      const review =
        await getReview(
          req.params.id,
        );

      if (!review) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      const result =
        await pool.query(
          `SELECT
             id,
             performance_review_id,
             title,
             description,
             target,
             status,
             created_at,
             updated_at
           FROM performance_goals
           WHERE performance_review_id = $1
           ORDER BY id ASC;`,
          [req.params.id],
        );

      res.json({
        success: true,
        data: result.rows.map(
          mapGoal,
        ),
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        "Performance goal list error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load performance goals",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Goals - Create                                                             */
/* -------------------------------------------------------------------------- */

router.post(
  "/:id/goals",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance review ID",
        });
      }

      if (
        !(await getReview(
          req.params.id,
        ))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Performance review not found",
        });
      }

      const {
        title,
        description = null,
        target = null,
        status = "NOT_STARTED",
      } = req.body;

      const normalizedStatus =
        typeof status === "string"
          ? status.toUpperCase()
          : status;

      const validationError =
        validateGoal({
          title,
          status: normalizedStatus,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const result =
        await pool.query(
          `INSERT INTO performance_goals
            (
              performance_review_id,
              title,
              description,
              target,
              status
            )
           VALUES
            (
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
             updated_at;`,
          [
            req.params.id,
            title.trim(),
            description?.trim() || null,
            target?.trim() || null,
            normalizedStatus,
          ],
        );

      res.status(201).json({
        success: true,
        message:
          "Performance goal created successfully",
        data: mapGoal(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Performance goal creation error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create performance goal",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/* Goals - Update                                                             */
/* -------------------------------------------------------------------------- */

router.put(
  "/:id/goals/:goalId",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(req.params.goalId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid performance or goal ID",
        });
      }

      const existing =
        await pool.query(
          `SELECT id
           FROM performance_goals
           WHERE id = $1
           AND performance_review_id = $2
           LIMIT 1;`,
          [
            req.params.goalId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Performance goal not found",
        });
      }

      const {
        title,
        description,
        target,
        status,
      } = req.body;

      const normalizedStatus =
        typeof status === "string"
          ? status.toUpperCase()
          : status;

      const validationError =
        validateGoal(
          {
            title,
            status: normalizedStatus,
          },
          true,
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const updates = [];
      const values = [];

      const addUpdate = (
        column,
        value,
      ) => {
        values.push(value);

        updates.push(
          `${column} = $${values.length}`,
        );
      };

      if (title !== undefined) {
        addUpdate(
          "title",
          title.trim(),
        );
      }

      if (
        description !== undefined
      ) {
        addUpdate(
          "description",
          description?.trim() || null,
        );
      }

      if (target !== undefined) {
        addUpdate(
          "target",
          target?.trim() || null,
        );
      }

      if (
        normalizedStatus !== undefined
      ) {
        addUpdate(
          "status",
          normalizedStatus,
        );
      }

      if (!updates.length) {
        return res.status(400).json({
          success: false,
          message:
            "At least one field is required",
        });
      }

      updates.push(
        "updated_at = CURRENT_TIMESTAMP",
      );

      values.push(req.params.goalId);

      const result =
        await pool.query(
          `UPDATE performance_goals
           SET ${updates.join(", ")}
           WHERE id = $${values.length}
           RETURNING
             id,
             performance_review_id,
             title,
             description,
             target,
             status,
             created_at,
             updated_at;`,
          values,
        );

      res.json({
        success: true,
        message:
          "Performance goal updated successfully",
        data: mapGoal(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Performance goal update error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update performance goal",
      });
    }
  },
);

export default router;