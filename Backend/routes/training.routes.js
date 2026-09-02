import express from "express";
import pool from "../db.js";

const router = express.Router();

const PROGRAM_MODES = ["ONLINE", "OFFLINE", "HYBRID"];
const PROGRAM_STATUSES = ["ACTIVE", "INACTIVE"];

const ENROLLMENT_STATUSES = [
  "ASSIGNED",
  "REGISTERED",
  "ATTENDED",
  "COMPLETED",
  "ASSESSMENT",
  "CERTIFICATE",
];

const ASSESSMENT_RESULTS = ["PASS", "FAIL"];

const SKILL_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
];

const isValidId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

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

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) return value;

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseNonNegativeNumber = (value) => {
  if (typeof value === "number") return value;

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return Number.NaN;
};

const mapProgram = (program) => ({
  id: Number(program.id),
  courseName: program.course_name,
  category: program.category,
  trainer: program.trainer,
  duration: program.duration,
  cost: Number(program.cost),
  mode: program.mode,
  assessment: program.assessment,
  description: program.description,
  status: program.status,
  createdAt: program.created_at,
  updatedAt: program.updated_at,
});

const mapEnrollment = (enrollment) => ({
  id: Number(enrollment.id),
  trainingProgramId: Number(enrollment.training_program_id),
  employeeId: Number(enrollment.employee_id),
  employeeCode: enrollment.employee_code,
  employeeName: `${enrollment.first_name} ${
    enrollment.last_name ?? ""
  }`.trim(),
  employeeDepartment:
    enrollment.department_name ?? "Unassigned",
  status: enrollment.status,
  assignedDate: formatDateOnly(enrollment.assigned_date),
  registeredDate: formatDateOnly(enrollment.registered_date),
  attendedDate: formatDateOnly(enrollment.attended_date),
  completedDate: formatDateOnly(enrollment.completed_date),
  assessmentScore:
    enrollment.assessment_score === null
      ? null
      : Number(enrollment.assessment_score),
  assessmentResult: enrollment.assessment_result,
  certificateName: enrollment.certificate_name,
  certificateUrl: enrollment.certificate_url,
  certificateDate: formatDateOnly(
    enrollment.certificate_date,
  ),
  remarks: enrollment.remarks,
  createdAt: enrollment.created_at,
  updatedAt: enrollment.updated_at,
});

const mapSkill = (skill) => ({
  id: Number(skill.id),
  employeeId: Number(skill.employee_id),
  employeeCode: skill.employee_code,
  employeeName: `${skill.first_name} ${
    skill.last_name ?? ""
  }`.trim(),
  trainingEnrollmentId: skill.training_enrollment_id
    ? Number(skill.training_enrollment_id)
    : null,
  skillName: skill.skill_name,
  skillLevel: skill.skill_level,
  acquiredDate: formatDateOnly(skill.acquired_date),
  remarks: skill.remarks,
  createdAt: skill.created_at,
  updatedAt: skill.updated_at,
});

const getProgram = async (id) => {
  const result = await pool.query(
    `
      SELECT
        id,
        course_name,
        category,
        trainer,
        duration,
        cost,
        mode,
        assessment,
        description,
        status,
        created_at,
        updated_at
      FROM training_programs
      WHERE id = $1
      LIMIT 1;
    `,
    [id],
  );

  return result.rows[0];
};

const enrollmentSelect = `
  SELECT
    te.id,
    te.training_program_id,
    te.employee_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    d.name AS department_name,
    te.status,
    te.assigned_date,
    te.registered_date,
    te.attended_date,
    te.completed_date,
    te.assessment_score,
    te.assessment_result,
    te.certificate_name,
    te.certificate_url,
    te.certificate_date,
    te.remarks,
    te.created_at,
    te.updated_at
  FROM training_enrollments te
  INNER JOIN employees e
    ON e.id = te.employee_id
  LEFT JOIN departments d
    ON d.id = e.department_id
`;

const skillSelect = `
  SELECT
    es.id,
    es.employee_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    es.training_enrollment_id,
    es.skill_name,
    es.skill_level,
    es.acquired_date,
    es.remarks,
    es.created_at,
    es.updated_at
  FROM employee_skills es
  INNER JOIN employees e
    ON e.id = es.employee_id
`;

const validateProgram = (
  fields,
  partial = false,
) => {
  const requiredFields = [
    "courseName",
    "category",
    "trainer",
    "duration",
  ];

  for (const field of requiredFields) {
    if (
      (!partial ||
        fields[field] !== undefined) &&
      (typeof fields[field] !== "string" ||
        !fields[field].trim())
    ) {
      return `${field} is required`;
    }
  }

  if (
    !partial ||
    fields.cost !== undefined
  ) {
    const cost = parseNonNegativeNumber(
      fields.cost,
    );

    if (
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      return "Cost must be a non-negative number";
    }
  }

  if (
    fields.mode !== undefined &&
    (
      typeof fields.mode !== "string" ||
      !PROGRAM_MODES.includes(
        fields.mode.toUpperCase(),
      )
    )
  ) {
    return "Invalid training mode";
  }

  if (
    fields.status !== undefined &&
    (
      typeof fields.status !== "string" ||
      !PROGRAM_STATUSES.includes(
        fields.status.toUpperCase(),
      )
    )
  ) {
    return "Invalid training program status";
  }

  return null;
};

const validateEnrollment = (
  fields,
  partial = false,
) => {
  if (
    (!partial ||
      fields.employeeId !== undefined) &&
    !isValidId(fields.employeeId)
  ) {
    return "Valid employee ID is required";
  }

  if (
    fields.status !== undefined &&
    (
      typeof fields.status !== "string" ||
      !ENROLLMENT_STATUSES.includes(
        fields.status.toUpperCase(),
      )
    )
  ) {
    return "Invalid enrollment status";
  }

  for (const field of [
    "assignedDate",
    "registeredDate",
    "attendedDate",
    "completedDate",
    "certificateDate",
  ]) {
    if (
      fields[field] !== undefined &&
      fields[field] !== null &&
      !isValidDate(fields[field])
    ) {
      return `${field} must be a valid date in YYYY-MM-DD format`;
    }
  }

  if (
    fields.assessmentScore !== undefined &&
    fields.assessmentScore !== null
  ) {
    const score = parseNonNegativeNumber(
      fields.assessmentScore,
    );

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 100
    ) {
      return "Assessment score must be between 0 and 100";
    }
  }

  if (
    fields.assessmentResult !== undefined &&
    fields.assessmentResult !== null &&
    (
      typeof fields.assessmentResult !== "string" ||
      !ASSESSMENT_RESULTS.includes(
        fields.assessmentResult.toUpperCase(),
      )
    )
  ) {
    return "Assessment result must be PASS or FAIL";
  }

  return null;
};

const validateSkill = (
  fields,
  partial = false,
) => {
  if (
    (!partial ||
      fields.employeeId !== undefined) &&
    !isValidId(fields.employeeId)
  ) {
    return "Valid employee ID is required";
  }

  if (
    (!partial ||
      fields.skillName !== undefined) &&
    (
      typeof fields.skillName !== "string" ||
      !fields.skillName.trim()
    )
  ) {
    return "Skill name is required";
  }

  if (
    fields.trainingEnrollmentId !== undefined &&
    fields.trainingEnrollmentId !== null &&
    !isValidId(
      fields.trainingEnrollmentId,
    )
  ) {
    return "Training enrollment ID must be valid";
  }

  if (
    fields.skillLevel !== undefined &&
    (
      typeof fields.skillLevel !== "string" ||
      !SKILL_LEVELS.includes(
        fields.skillLevel.toUpperCase(),
      )
    )
  ) {
    return "Invalid skill level";
  }

  if (
    fields.acquiredDate !== undefined &&
    fields.acquiredDate !== null &&
    !isValidDate(fields.acquiredDate)
  ) {
    return "Acquired date must be a valid date in YYYY-MM-DD format";
  }

  return null;
};

/* =========================================================
   TRAINING PROGRAMS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      status = "",
    } = req.query;

    const values = [];
    const conditions = [];

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      values.push(
        `%${search.trim()}%`,
      );

      conditions.push(`(
        tp.course_name ILIKE $${values.length}
        OR tp.category ILIKE $${values.length}
        OR tp.trainer ILIKE $${values.length}
      )`);
    }

    if (category) {
      values.push(String(category).trim());

      conditions.push(
        `tp.category = $${values.length}`,
      );
    }

    if (status) {
      const normalizedStatus =
        String(status).toUpperCase();

      if (
        !PROGRAM_STATUSES.includes(
          normalizedStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training program status",
        });
      }

      values.push(normalizedStatus);

      conditions.push(
        `tp.status = $${values.length}`,
      );
    }

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(
            " AND ",
          )}`
        : "";

    const result = await pool.query(
      `
        SELECT
          tp.id,
          tp.course_name,
          tp.category,
          tp.trainer,
          tp.duration,
          tp.cost,
          tp.mode,
          tp.assessment,
          tp.description,
          tp.status,
          tp.created_at,
          tp.updated_at
        FROM training_programs tp
        ${whereClause}
        ORDER BY tp.created_at DESC, tp.id DESC;
      `,
      values,
    );

    res.json({
      success: true,
      data: result.rows.map(mapProgram),
      total: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Training program list error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load training programs",
    });
  }
});

router.get(
  "/:id/enrollments",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training program ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const result =
        await pool.query(
          `${enrollmentSelect}
           WHERE te.training_program_id = $1
           ORDER BY te.created_at DESC, te.id DESC;`,
          [req.params.id],
        );

      res.json({
        success: true,
        data: result.rows.map(
          mapEnrollment,
        ),
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        "Training enrollment list error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load training enrollments",
      });
    }
  },
);

router.get(
  "/:id/skills",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training program ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const result =
        await pool.query(
          `${skillSelect}
           LEFT JOIN training_enrollments te
             ON te.id = es.training_enrollment_id
           WHERE (
             te.training_program_id = $1
             OR (
               es.training_enrollment_id IS NULL
               AND EXISTS (
                 SELECT 1
                 FROM training_enrollments te2
                 WHERE te2.training_program_id = $1
                   AND te2.employee_id = es.employee_id
               )
             )
           )
           ORDER BY es.created_at DESC, es.id DESC;`,
          [req.params.id],
        );

      res.json({
        success: true,
        data: result.rows.map(
          mapSkill,
        ),
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        "Training skill list error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load training skills",
      });
    }
  },
);

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
            "Invalid training program ID",
        });
      }

      const program =
        await getProgram(
          req.params.id,
        );

      if (!program) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const [
        enrollments,
        skills,
      ] = await Promise.all([
        pool.query(
          `${enrollmentSelect}
           WHERE te.training_program_id = $1
           ORDER BY te.created_at DESC, te.id DESC;`,
          [req.params.id],
        ),

        pool.query(
          `${skillSelect}
           LEFT JOIN training_enrollments te
             ON te.id = es.training_enrollment_id
           WHERE (
             te.training_program_id = $1
             OR (
               es.training_enrollment_id IS NULL
               AND EXISTS (
                 SELECT 1
                 FROM training_enrollments te2
                 WHERE te2.training_program_id = $1
                   AND te2.employee_id = es.employee_id
               )
             )
           )
           ORDER BY es.created_at DESC, es.id DESC;`,
          [req.params.id],
        ),
      ]);

      res.json({
        success: true,
        data: {
          ...mapProgram(program),
          enrollments:
            enrollments.rows.map(
              mapEnrollment,
            ),
          skills:
            skills.rows.map(
              mapSkill,
            ),
        },
      });
    } catch (error) {
      console.error(
        "Training program detail error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load training program",
      });
    }
  },
);

router.post("/", async (req, res) => {
  try {
    const {
      course_name: courseName,
      courseName: camelCourseName,
      category,
      trainer,
      duration,
      cost,
      mode,
      assessment = null,
      description = null,
      status = "ACTIVE",
    } = req.body;

    const fields = {
      courseName:
        courseName ??
        camelCourseName,
      category,
      trainer,
      duration,
      cost,
      mode,
      status,
    };

    const validationError =
      validateProgram(fields);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const result =
      await pool.query(
        `
          INSERT INTO training_programs
            (
              course_name,
              category,
              trainer,
              duration,
              cost,
              mode,
              assessment,
              description,
              status
            )
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id;
        `,
        [
          fields.courseName.trim(),
          fields.category.trim(),
          fields.trainer.trim(),
          fields.duration.trim(),
          parseNonNegativeNumber(
            fields.cost,
          ),
          fields.mode.toUpperCase(),
          assessment?.trim() || null,
          description?.trim() || null,
          fields.status.toUpperCase(),
        ],
      );

    res.status(201).json({
      success: true,
      message:
        "Training program created successfully",
      data: mapProgram(
        await getProgram(
          result.rows[0].id,
        ),
      ),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "A training program with these details already exists",
      });
    }

    console.error(
      "Training program creation error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create training program",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (
      !isValidId(req.params.id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid training program ID",
      });
    }

    if (
      !(await getProgram(req.params.id))
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Training program not found",
      });
    }

    const {
      course_name: courseName,
      courseName: camelCourseName,
      category,
      trainer,
      duration,
      cost,
      mode,
      assessment,
      description,
      status,
    } = req.body;

    const fields = {
      courseName:
        courseName ??
        camelCourseName,
      category,
      trainer,
      duration,
      cost,
      mode,
      status,
    };

    const validationError =
      validateProgram(
        fields,
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

    if (
      fields.courseName !==
      undefined
    ) {
      addUpdate(
        "course_name",
        fields.courseName.trim(),
      );
    }

    if (
      fields.category !==
      undefined
    ) {
      addUpdate(
        "category",
        fields.category.trim(),
      );
    }

    if (
      fields.trainer !==
      undefined
    ) {
      addUpdate(
        "trainer",
        fields.trainer.trim(),
      );
    }

    if (
      fields.duration !==
      undefined
    ) {
      addUpdate(
        "duration",
        fields.duration.trim(),
      );
    }

    if (
      fields.cost !==
      undefined
    ) {
      addUpdate(
        "cost",
        parseNonNegativeNumber(
          fields.cost,
        ),
      );
    }

    if (
      fields.mode !==
      undefined
    ) {
      addUpdate(
        "mode",
        fields.mode.toUpperCase(),
      );
    }

    if (
      assessment !==
      undefined
    ) {
      addUpdate(
        "assessment",
        assessment?.trim() || null,
      );
    }

    if (
      description !==
      undefined
    ) {
      addUpdate(
        "description",
        description?.trim() || null,
      );
    }

    if (
      fields.status !==
      undefined
    ) {
      addUpdate(
        "status",
        fields.status.toUpperCase(),
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

    values.push(
      req.params.id,
    );

    await pool.query(
      `
        UPDATE training_programs
        SET ${updates.join(", ")}
        WHERE id = $${values.length};
      `,
      values,
    );

    res.json({
      success: true,
      message:
        "Training program updated successfully",
      data: mapProgram(
        await getProgram(
          req.params.id,
        ),
      ),
    });
  } catch (error) {
    console.error(
      "Training program update error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update training program",
    });
  }
});

/* =========================================================
   DELETE TRAINING PROGRAM
========================================================= */

router.delete(
  "/:id",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training program ID",
        });
      }

      const program =
        await getProgram(
          req.params.id,
        );

      if (!program) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      await client.query(
        "BEGIN",
      );

      /*
       * employee_skills are linked to
       * training_enrollments.
       *
       * Delete them first, then enrollments,
       * then the training program.
       */
      await client.query(
        `
          DELETE FROM employee_skills
          WHERE training_enrollment_id IN (
            SELECT id
            FROM training_enrollments
            WHERE training_program_id = $1
          );
        `,
        [req.params.id],
      );

      await client.query(
        `
          DELETE FROM training_enrollments
          WHERE training_program_id = $1;
        `,
        [req.params.id],
      );

      const result =
        await client.query(
          `
            DELETE FROM training_programs
            WHERE id = $1
            RETURNING id;
          `,
          [req.params.id],
        );

      if (!result.rows.length) {
        await client.query(
          "ROLLBACK",
        );

        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      await client.query(
        "COMMIT",
      );

      res.json({
        success: true,
        message:
          "Training program deleted successfully",
        data: null,
      });
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      console.error(
        "Training program deletion error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete training program",
      });
    } finally {
      client.release();
    }
  },
);

/* =========================================================
   ENROLLMENTS
========================================================= */

router.post(
  "/:id/enrollments",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training program ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const {
        employee_id: employeeIdSnake,
        employeeId,
        status = "ASSIGNED",
        assigned_date:
          assignedDateSnake,
        assignedDate,
        remarks = null,
      } = req.body;

      const fields = {
        employeeId:
          employeeId ??
          employeeIdSnake,
        status,
        assignedDate:
          assignedDate ??
          assignedDateSnake,
      };

      const validationError =
        validateEnrollment(
          fields,
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
        });
      }

      const employee =
        await pool.query(
          `
            SELECT id
            FROM employees
            WHERE id = $1
            LIMIT 1;
          `,
          [fields.employeeId],
        );

      if (!employee.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO training_enrollments
              (
                training_program_id,
                employee_id,
                status,
                assigned_date,
                remarks
              )
            VALUES
              (
                $1,
                $2,
                $3,
                COALESCE($4, CURRENT_DATE),
                $5
              )
            RETURNING id;
          `,
          [
            req.params.id,
            fields.employeeId,
            fields.status.toUpperCase(),
            fields.assignedDate ??
              null,
            remarks?.trim() ||
              null,
          ],
        );

      const enrollment =
        await pool.query(
          `${enrollmentSelect}
           WHERE te.id = $1;`,
          [result.rows[0].id],
        );

      res.status(201).json({
        success: true,
        message:
          "Employee enrolled successfully",
        data: mapEnrollment(
          enrollment.rows[0],
        ),
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "Employee is already enrolled in this training program",
        });
      }

      console.error(
        "Training enrollment creation error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create training enrollment",
      });
    }
  },
);

router.put(
  "/:id/enrollments/:enrollmentId",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(
          req.params.enrollmentId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training or enrollment ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const existing =
        await pool.query(
          `
            SELECT id
            FROM training_enrollments
            WHERE id = $1
              AND training_program_id = $2
            LIMIT 1;
          `,
          [
            req.params.enrollmentId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Training enrollment not found",
        });
      }

      const {
        status,
        registered_date:
          registeredDateSnake,
        registeredDate,
        attended_date:
          attendedDateSnake,
        attendedDate,
        completed_date:
          completedDateSnake,
        completedDate,
        assessment_score:
          assessmentScoreSnake,
        assessmentScore,
        assessment_result:
          assessmentResultSnake,
        assessmentResult,
        certificate_name:
          certificateNameSnake,
        certificateName,
        certificate_url:
          certificateUrlSnake,
        certificateUrl,
        certificate_date:
          certificateDateSnake,
        certificateDate,
        remarks,
      } = req.body;

      const fields = {
        status,
        registeredDate:
          registeredDate ??
          registeredDateSnake,
        attendedDate:
          attendedDate ??
          attendedDateSnake,
        completedDate:
          completedDate ??
          completedDateSnake,
        assessmentScore:
          assessmentScore ??
          assessmentScoreSnake,
        assessmentResult:
          assessmentResult ??
          assessmentResultSnake,
      };

      const validationError =
        validateEnrollment(
          fields,
          true,
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
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

      if (
        status !== undefined
      ) {
        addUpdate(
          "status",
          status.toUpperCase(),
        );
      }

      if (
        fields.registeredDate !==
        undefined
      ) {
        addUpdate(
          "registered_date",
          fields.registeredDate,
        );
      }

      if (
        fields.attendedDate !==
        undefined
      ) {
        addUpdate(
          "attended_date",
          fields.attendedDate,
        );
      }

      if (
        fields.completedDate !==
        undefined
      ) {
        addUpdate(
          "completed_date",
          fields.completedDate,
        );
      }

      if (
        fields.assessmentScore !==
        undefined
      ) {
        addUpdate(
          "assessment_score",
          fields.assessmentScore ===
          null
            ? null
            : parseNonNegativeNumber(
                fields.assessmentScore,
              ),
        );
      }

      if (
        fields.assessmentResult !==
        undefined
      ) {
        addUpdate(
          "assessment_result",
          fields.assessmentResult ===
          null
            ? null
            : fields.assessmentResult.toUpperCase(),
        );
      }

      if (
        certificateName !==
          undefined ||
        certificateNameSnake !==
          undefined
      ) {
        addUpdate(
          "certificate_name",
          (
            certificateName ??
            certificateNameSnake
          )?.trim() || null,
        );
      }

      if (
        certificateUrl !==
          undefined ||
        certificateUrlSnake !==
          undefined
      ) {
        addUpdate(
          "certificate_url",
          (
            certificateUrl ??
            certificateUrlSnake
          )?.trim() || null,
        );
      }

      if (
        fields.certificateDate !==
        undefined
      ) {
        addUpdate(
          "certificate_date",
          fields.certificateDate,
        );
      }

      if (
        remarks !== undefined
      ) {
        addUpdate(
          "remarks",
          remarks?.trim() || null,
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

      values.push(
        req.params.enrollmentId,
      );

      values.push(
        req.params.id,
      );

      await pool.query(
        `
          UPDATE training_enrollments
          SET ${updates.join(", ")}
          WHERE id = $${values.length - 1}
            AND training_program_id = $${values.length};
        `,
        values,
      );

      const enrollment =
        await pool.query(
          `${enrollmentSelect}
           WHERE te.id = $1;`,
          [
            req.params.enrollmentId,
          ],
        );

      res.json({
        success: true,
        message:
          "Training enrollment updated successfully",
        data: mapEnrollment(
          enrollment.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Training enrollment update error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update training enrollment",
      });
    }
  },
);

router.delete(
  "/:id/enrollments/:enrollmentId",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(
          req.params.enrollmentId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training or enrollment ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const existing =
        await client.query(
          `
            SELECT id
            FROM training_enrollments
            WHERE id = $1
              AND training_program_id = $2
            LIMIT 1;
          `,
          [
            req.params.enrollmentId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Training enrollment not found",
        });
      }

      await client.query(
        "BEGIN",
      );

      await client.query(
        `
          DELETE FROM employee_skills
          WHERE training_enrollment_id = $1;
        `,
        [
          req.params.enrollmentId,
        ],
      );

      await client.query(
        `
          DELETE FROM training_enrollments
          WHERE id = $1
            AND training_program_id = $2;
        `,
        [
          req.params.enrollmentId,
          req.params.id,
        ],
      );

      await client.query(
        "COMMIT",
      );

      res.json({
        success: true,
        message:
          "Training enrollment deleted successfully",
        data: null,
      });
    } catch (error) {
      await client.query(
        "ROLLBACK",
      );

      console.error(
        "Training enrollment deletion error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete training enrollment",
      });
    } finally {
      client.release();
    }
  },
);

/* =========================================================
   SKILLS
========================================================= */

router.post(
  "/:id/skills",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training program ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const {
        employee_id: employeeIdSnake,
        employeeId,
        training_enrollment_id:
          enrollmentIdSnake,
        trainingEnrollmentId,
        skill_name: skillNameSnake,
        skillName,
        skill_level: skillLevelSnake,
        skillLevel,
        acquired_date:
          acquiredDateSnake,
        acquiredDate,
        remarks = null,
      } = req.body;

      const fields = {
        employeeId:
          employeeId ??
          employeeIdSnake,

        trainingEnrollmentId:
          trainingEnrollmentId ??
          enrollmentIdSnake,

        skillName:
          skillName ??
          skillNameSnake,

        skillLevel:
          skillLevel ??
          skillLevelSnake ??
          "BEGINNER",

        acquiredDate:
          acquiredDate ??
          acquiredDateSnake,
      };

      const validationError =
        validateSkill(fields);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
        });
      }

      const employee =
        await pool.query(
          `
            SELECT id
            FROM employees
            WHERE id = $1
            LIMIT 1;
          `,
          [fields.employeeId],
        );

      if (!employee.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      /*
       * A skill belongs to the selected
       * training program through its
       * training enrollment.
       *
       * If the frontend doesn't send an
       * enrollment ID, automatically find
       * the employee's enrollment for this
       * training program.
       */
      let resolvedEnrollmentId =
        fields.trainingEnrollmentId;

      if (
        resolvedEnrollmentId ===
          undefined ||
        resolvedEnrollmentId === null
      ) {
        const enrollment =
          await pool.query(
            `
              SELECT id
              FROM training_enrollments
              WHERE training_program_id = $1
                AND employee_id = $2
              LIMIT 1;
            `,
            [
              req.params.id,
              fields.employeeId,
            ],
          );

        if (!enrollment.rows.length) {
          return res.status(400).json({
            success: false,
            message:
              "Employee must be enrolled in this training program before a skill can be added",
          });
        }

        resolvedEnrollmentId =
          enrollment.rows[0].id;
      } else {
        const enrollment =
          await pool.query(
            `
              SELECT id
              FROM training_enrollments
              WHERE id = $1
                AND training_program_id = $2
                AND employee_id = $3
              LIMIT 1;
            `,
            [
              resolvedEnrollmentId,
              req.params.id,
              fields.employeeId,
            ],
          );

        if (!enrollment.rows.length) {
          return res.status(400).json({
            success: false,
            message:
              "Training enrollment does not belong to this program and employee",
          });
        }
      }

      const result =
        await pool.query(
          `
            INSERT INTO employee_skills
              (
                employee_id,
                training_enrollment_id,
                skill_name,
                skill_level,
                acquired_date,
                remarks
              )
            VALUES
              ($1, $2, $3, $4, $5, $6)
            RETURNING id;
          `,
          [
            fields.employeeId,
            resolvedEnrollmentId,
            fields.skillName.trim(),
            fields.skillLevel.toUpperCase(),
            fields.acquiredDate ??
              null,
            remarks?.trim() ||
              null,
          ],
        );

      const skill =
        await pool.query(
          `${skillSelect}
           WHERE es.id = $1;`,
          [result.rows[0].id],
        );

      res.status(201).json({
        success: true,
        message:
          "Employee skill created successfully",
        data: mapSkill(
          skill.rows[0],
        ),
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "This employee skill already exists",
        });
      }

      console.error(
        "Training skill creation error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create employee skill",
      });
    }
  },
);

router.put(
  "/:id/skills/:skillId",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(
          req.params.skillId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training or skill ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const existing =
        await pool.query(
          `
            SELECT
              es.id,
              es.employee_id,
              es.training_enrollment_id
            FROM employee_skills es
            LEFT JOIN training_enrollments te
              ON te.id = es.training_enrollment_id
            WHERE es.id = $1
              AND (
                te.training_program_id = $2
                OR (
                  es.training_enrollment_id IS NULL
                  AND EXISTS (
                    SELECT 1
                    FROM training_enrollments te2
                    WHERE te2.training_program_id = $2
                      AND te2.employee_id = es.employee_id
                  )
                )
              )
            LIMIT 1;
          `,
          [
            req.params.skillId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Training skill not found",
        });
      }

      const {
        employee_id: employeeIdSnake,
        employeeId,
        training_enrollment_id:
          enrollmentIdSnake,
        trainingEnrollmentId,
        skill_name: skillNameSnake,
        skillName,
        skill_level: skillLevelSnake,
        skillLevel,
        acquired_date:
          acquiredDateSnake,
        acquiredDate,
        remarks,
      } = req.body;

      const fields = {
        employeeId:
          employeeId ??
          employeeIdSnake,

        trainingEnrollmentId:
          trainingEnrollmentId ??
          enrollmentIdSnake,

        skillName:
          skillName ??
          skillNameSnake,

        skillLevel:
          skillLevel ??
          skillLevelSnake,

        acquiredDate:
          acquiredDate ??
          acquiredDateSnake,
      };

      const validationError =
        validateSkill(
          fields,
          true,
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError,
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

      const currentEmployeeId =
        existing.rows[0]
          .employee_id;

      const newEmployeeId =
        fields.employeeId !==
        undefined
          ? fields.employeeId
          : currentEmployeeId;

      /*
       * Resolve enrollment whenever the
       * employee changes or an enrollment
       * wasn't supplied.
       */
      let resolvedEnrollmentId =
        fields.trainingEnrollmentId;

      if (
        resolvedEnrollmentId ===
          undefined ||
        resolvedEnrollmentId === null
      ) {
        const enrollment =
          await pool.query(
            `
              SELECT id
              FROM training_enrollments
              WHERE training_program_id = $1
                AND employee_id = $2
              LIMIT 1;
            `,
            [
              req.params.id,
              newEmployeeId,
            ],
          );

        if (!enrollment.rows.length) {
          return res.status(400).json({
            success: false,
            message:
              "Employee must be enrolled in this training program",
          });
        }

        resolvedEnrollmentId =
          enrollment.rows[0].id;
      } else {
        const enrollment =
          await pool.query(
            `
              SELECT id
              FROM training_enrollments
              WHERE id = $1
                AND training_program_id = $2
                AND employee_id = $3
              LIMIT 1;
            `,
            [
              resolvedEnrollmentId,
              req.params.id,
              newEmployeeId,
            ],
          );

        if (!enrollment.rows.length) {
          return res.status(400).json({
            success: false,
            message:
              "Training enrollment does not belong to this program and employee",
          });
        }
      }

      if (
        fields.employeeId !==
        undefined
      ) {
        addUpdate(
          "employee_id",
          newEmployeeId,
        );
      }

      if (
        resolvedEnrollmentId !==
        undefined
      ) {
        addUpdate(
          "training_enrollment_id",
          resolvedEnrollmentId,
        );
      }

      if (
        fields.skillName !==
        undefined
      ) {
        addUpdate(
          "skill_name",
          fields.skillName.trim(),
        );
      }

      if (
        fields.skillLevel !==
        undefined
      ) {
        addUpdate(
          "skill_level",
          fields.skillLevel.toUpperCase(),
        );
      }

      if (
        fields.acquiredDate !==
        undefined
      ) {
        addUpdate(
          "acquired_date",
          fields.acquiredDate,
        );
      }

      if (
        remarks !== undefined
      ) {
        addUpdate(
          "remarks",
          remarks?.trim() || null,
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

      values.push(
        req.params.skillId,
      );

      await pool.query(
        `
          UPDATE employee_skills
          SET ${updates.join(", ")}
          WHERE id = $${values.length};
        `,
        values,
      );

      const skill =
        await pool.query(
          `${skillSelect}
           WHERE es.id = $1;`,
          [req.params.skillId],
        );

      res.json({
        success: true,
        message:
          "Employee skill updated successfully",
        data: mapSkill(
          skill.rows[0],
        ),
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "This employee skill already exists",
        });
      }

      console.error(
        "Training skill update error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update employee skill",
      });
    }
  },
);

router.delete(
  "/:id/skills/:skillId",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(
          req.params.skillId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid training or skill ID",
        });
      }

      if (
        !(await getProgram(req.params.id))
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Training program not found",
        });
      }

      const existing =
        await pool.query(
          `
            SELECT es.id
            FROM employee_skills es
            LEFT JOIN training_enrollments te
              ON te.id = es.training_enrollment_id
            WHERE es.id = $1
              AND (
                te.training_program_id = $2
                OR (
                  es.training_enrollment_id IS NULL
                  AND EXISTS (
                    SELECT 1
                    FROM training_enrollments te2
                    WHERE te2.training_program_id = $2
                      AND te2.employee_id = es.employee_id
                  )
                )
              )
            LIMIT 1;
          `,
          [
            req.params.skillId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Training skill not found",
        });
      }

      await pool.query(
        `
          DELETE FROM employee_skills
          WHERE id = $1;
        `,
        [req.params.skillId],
      );

      res.json({
        success: true,
        message:
          "Employee skill deleted successfully",
        data: null,
      });
    } catch (error) {
      console.error(
        "Training skill deletion error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete employee skill",
      });
    }
  },
);

export default router;