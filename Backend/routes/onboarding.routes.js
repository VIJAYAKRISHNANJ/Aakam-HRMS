import express from "express";
import pool from "../db.js";

const router = express.Router();

const ONBOARDING_STATUSES = [
  "INITIATED",
  "DOCUMENTS_PENDING",
  "VERIFICATION_PENDING",
  "READY_TO_JOIN",
  "JOINED",
  "ALLOCATION_PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

const DOCUMENT_STATUSES = [
  "PENDING",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
];

const DOCUMENT_TYPES = [
  "RESUME",
  "IDENTITY_PROOF",
  "ADDRESS_PROOF",
  "EDUCATIONAL_CERTIFICATE",
  "EXPERIENCE_CERTIFICATE",
  "OFFER_DOCUMENTATION",
  "OTHER",
];

const isValidId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidDate = (value) => {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  );
};

const mapTask = (task) => ({
  id: Number(task.id),
  onboardingId: Number(task.onboarding_id),
  taskName: task.task_name,
  description: task.description,
  owner: task.owner,
  status: task.status,
  dueDate: task.due_date,
  completedAt: task.completed_at,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
});

const mapDocument = (document) => ({
  id: Number(document.id),
  onboardingId: Number(document.onboarding_id),
  documentName: document.document_name,
  documentType: document.document_type,
  status: document.status,
  verifiedBy: document.verified_by,
  verifiedAt: document.verified_at,
  remarks: document.remarks,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
});

const mapEmployee = (employee) => ({
  id: Number(employee.id),
  employeeCode: employee.employee_code,
  firstName: employee.first_name,
  lastName: employee.last_name,
  fullName: `${employee.first_name} ${employee.last_name ?? ""}`.trim(),
  email: employee.email,
  departmentId: employee.department_id
    ? Number(employee.department_id)
    : null,
  joiningDate: employee.joining_date,
  status: employee.employment_status,
  employmentType: employee.employment_type,
  createdAt: employee.created_at,
});

const mapOnboarding = (record, progress = {}) => ({
  id: Number(record.id),
  onboardingCode: record.onboarding_code,
  candidateId: Number(record.candidate_id),
  candidateName: record.candidate_name,
  candidateEmail: record.candidate_email,
  jobPosition: record.job_title,
  recruitmentStage: record.candidate_stage,
  employeeId: record.employee_id
    ? Number(record.employee_id)
    : null,
  employeeCode: record.employee_code ?? null,
  expectedJoiningDate: record.expected_joining_date,
  actualJoiningDate: record.actual_joining_date,
  departmentId: record.department_id
    ? Number(record.department_id)
    : null,
  department: record.department_name ?? "Unassigned",
  status: record.status,
  documentVerificationStatus:
    record.document_verification_status,
  assetAllocationStatus:
    record.asset_allocation_status,
  systemAccessStatus:
    record.system_access_status,
  completionDate: record.completion_date,

  documentProgress: {
    total: Number(
      progress.document_total ??
        record.document_total ??
        0,
    ),
    completed: Number(
      progress.document_completed ??
        record.document_completed ??
        0,
    ),
  },

  checklistProgress: {
    total: Number(
      progress.task_total ??
        record.task_total ??
        0,
    ),
    completed: Number(
      progress.task_completed ??
        record.task_completed ??
        0,
    ),
  },

  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const onboardingSelect = `
  SELECT
    o.id,
    o.onboarding_code,
    o.candidate_id,
    c.name AS candidate_name,
    c.email AS candidate_email,
    c.stage AS candidate_stage,
    j.title AS job_title,
    o.employee_id,
    e.employee_code,
    o.expected_joining_date,
    o.actual_joining_date,
    o.department_id,
    d.name AS department_name,
    o.status,
    o.document_verification_status,
    o.asset_allocation_status,
    o.system_access_status,
    o.completion_date,
    o.created_at,
    o.updated_at,

    COUNT(DISTINCT od.id) AS document_total,

    COUNT(DISTINCT od.id)
      FILTER (
        WHERE od.status = 'VERIFIED'
      ) AS document_completed,

    COUNT(DISTINCT ot.id) AS task_total,

    COUNT(DISTINCT ot.id)
      FILTER (
        WHERE ot.status = 'COMPLETED'
      ) AS task_completed

  FROM onboardings o

  INNER JOIN candidates c
    ON c.id = o.candidate_id

  LEFT JOIN job_positions j
    ON j.id = c.job_position_id

  LEFT JOIN employees e
    ON e.id = o.employee_id

  LEFT JOIN departments d
    ON d.id = o.department_id

  LEFT JOIN onboarding_documents od
    ON od.onboarding_id = o.id

  LEFT JOIN onboarding_tasks ot
    ON ot.onboarding_id = o.id
`;

const onboardingGroup = `
  GROUP BY
    o.id,
    c.name,
    c.email,
    c.stage,
    j.title,
    e.employee_code,
    d.name
`;

const addOnboardingScope = (
  req,
  values,
  conditions,
) => {
  /*
   * SUPER_ADMINISTRATOR:
   * Global access.
   */
  if (
    !req.user.roles.includes(
      "SUPER_ADMINISTRATOR",
    )
  ) {
    values.push(req.user.requestedCompanyId);

    conditions.push(
      `o.company_id = $${values.length}`,
    );
  }

  /*
   * EMPLOYEE:
   * Employee can only access their own onboarding.
   */
  if (
    req.user.roles.includes("EMPLOYEE")
  ) {
    values.push(
      req.user.employee_id ?? -1,
    );

    conditions.push(
      `o.employee_id = $${values.length}`,
    );
  }

  /*
   * MANAGER:
   * Manager can only access onboarding records
   * belonging to their direct reports.
   *
   * HR_ADMINISTRATOR is intentionally excluded
   * because HR should have broader company scope.
   */
  if (
    req.user.roles.includes("MANAGER") &&
    !req.user.roles.includes(
      "HR_ADMINISTRATOR",
    )
  ) {
    values.push(
      req.user.employee_id ?? -1,
    );

    conditions.push(`
      e.reporting_manager_id = $${values.length}
    `);
  }

  /*
   * CLIENT_USER:
   * Client users can only access onboarding
   * records connected to their client.
   */
  if (
    req.user.roles.includes("CLIENT_USER")
  ) {
    values.push(
      req.user.client_id ?? -1,
    );

    conditions.push(
      `j.client_id = $${values.length}`,
    );
  }
};

const getOnboarding = async (
  req,
  id,
) => {
  const values = [id];

  const conditions = [
    "o.id = $1",
  ];

  addOnboardingScope(
    req,
    values,
    conditions,
  );

  const result = await pool.query(
    `
      ${onboardingSelect}

      WHERE ${conditions.join(" AND ")}

      ${onboardingGroup};
    `,
    values,
  );

  return result.rows[0];
};

const verifyExists = async (
  req,
  table,
  id,
) => {
  const companyColumn =
    table === "departments"
      ? "company_id"
      : "company_id";

  const result = await pool.query(
    `
      SELECT id
      FROM ${table}
      WHERE id = $1
        AND (
          $2::boolean
          OR ${companyColumn} = $3
        )
      LIMIT 1;
    `,
    [
      id,
      req.user.roles.includes(
        "SUPER_ADMINISTRATOR",
      ),
      req.user.requestedCompanyId ?? null,
    ],
  );

  return result.rows.length > 0;
};

const validateOnboarding = ({
  onboardingCode,
  expectedJoiningDate,
  actualJoiningDate,
  status,
}) => {
  if (
    onboardingCode !== undefined &&
    (
      typeof onboardingCode !== "string" ||
      !onboardingCode.trim()
    )
  ) {
    return "Onboarding code must be a non-empty string";
  }

  if (
    expectedJoiningDate !== undefined &&
    !isValidDate(expectedJoiningDate)
  ) {
    return "Expected joining date must be a valid date in YYYY-MM-DD format";
  }

  if (
    actualJoiningDate !== undefined &&
    actualJoiningDate !== null &&
    !isValidDate(actualJoiningDate)
  ) {
    return "Actual joining date must be a valid date in YYYY-MM-DD format";
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !ONBOARDING_STATUSES.includes(
        status.toUpperCase(),
      )
    )
  ) {
    return "Invalid onboarding status";
  }

  return null;
};

const validateTask = (
  {
    taskName,
    owner,
    status,
    dueDate,
  },
  partial = false,
) => {
  if (
    (!partial ||
      taskName !== undefined) &&
    (
      typeof taskName !== "string" ||
      !taskName.trim()
    )
  ) {
    return "Task name is required";
  }

  if (
    owner !== undefined &&
    owner !== null &&
    typeof owner !== "string"
  ) {
    return "Task owner must be a string";
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !TASK_STATUSES.includes(
        status.toUpperCase(),
      )
    )
  ) {
    return "Invalid task status";
  }

  if (
    dueDate !== undefined &&
    dueDate !== null &&
    !isValidDate(dueDate)
  ) {
    return "Due date must be a valid date in YYYY-MM-DD format";
  }

  return null;
};

const validateDocument = (
  {
    documentName,
    documentType,
    status,
  },
  partial = false,
) => {
  if (
    (!partial ||
      documentName !== undefined) &&
    (
      typeof documentName !== "string" ||
      !documentName.trim()
    )
  ) {
    return "Document name is required";
  }

  if (
    documentType !== undefined &&
    (
      typeof documentType !== "string" ||
      !DOCUMENT_TYPES.includes(
        documentType.toUpperCase(),
      )
    )
  ) {
    return "Invalid document type";
  }

  if (
    status !== undefined &&
    (
      typeof status !== "string" ||
      !DOCUMENT_STATUSES.includes(
        status.toUpperCase(),
      )
    )
  ) {
    return "Invalid document status";
  }

  return null;
};

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      department = "",
      joiningDate = "",
    } = req.query;

    const values = [];
    const conditions = [];

    if (search.trim()) {
      values.push(
        `%${search.trim()}%`,
      );

      conditions.push(`
        (
          o.onboarding_code ILIKE $${values.length}
          OR c.name ILIKE $${values.length}
          OR c.email ILIKE $${values.length}
          OR j.title ILIKE $${values.length}
        )
      `);
    }

    if (status) {
      const normalizedStatus =
        status.toUpperCase();

      if (
        !ONBOARDING_STATUSES.includes(
          normalizedStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid onboarding status",
        });
      }

      values.push(normalizedStatus);

      conditions.push(
        `o.status = $${values.length}`,
      );
    }

    if (department) {
      if (!isValidId(department)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid department ID",
        });
      }

      values.push(Number(department));

      conditions.push(
        `o.department_id = $${values.length}`,
      );
    }

    if (joiningDate) {
      if (!isValidDate(joiningDate)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid joining date",
        });
      }

      values.push(joiningDate);

      conditions.push(
        `o.expected_joining_date = $${values.length}`,
      );
    }

    addOnboardingScope(
      req,
      values,
      conditions,
    );

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
      `
        ${onboardingSelect}

        ${whereClause}

        ${onboardingGroup}

        ORDER BY
          o.created_at DESC,
          o.id DESC;
      `,
      values,
    );

    res.json({
      success: true,
      data: result.rows.map(
        mapOnboarding,
      ),
      total: result.rows.length,
    });
  } catch (error) {
    console.error(
      "Onboarding list error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load onboarding records",
    });
  }
});

router.get(
  "/:id/tasks",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid onboarding ID",
        });
      }

      const onboarding =
        await getOnboarding(
          req,
          req.params.id,
        );

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding record not found",
        });
      }

      const result = await pool.query(
        `
          SELECT
            id,
            onboarding_id,
            task_name,
            description,
            owner,
            status,
            due_date,
            completed_at,
            created_at,
            updated_at
          FROM onboarding_tasks
          WHERE onboarding_id = $1
          ORDER BY
            due_date NULLS LAST,
            id ASC;
        `,
        [req.params.id],
      );

      res.json({
        success: true,
        data: result.rows.map(mapTask),
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        "Onboarding task list error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load onboarding tasks",
      });
    }
  },
);

router.post(
  "/:id/tasks",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid onboarding ID",
        });
      }

      const onboarding =
        await getOnboarding(
          req,
          req.params.id,
        );

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding record not found",
        });
      }

      const {
        taskName,
        description = null,
        owner = null,
        status = "PENDING",
        dueDate = null,
      } = req.body;

      const validationError =
        validateTask({
          taskName,
          owner,
          status,
          dueDate,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const result = await pool.query(
        `
          INSERT INTO onboarding_tasks (
            onboarding_id,
            task_name,
            description,
            owner,
            status,
            due_date
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )
          RETURNING
            id,
            onboarding_id,
            task_name,
            description,
            owner,
            status,
            due_date,
            completed_at,
            created_at,
            updated_at;
        `,
        [
          req.params.id,
          taskName.trim(),
          description?.trim() || null,
          owner?.trim() || null,
          status.toUpperCase(),
          dueDate,
        ],
      );

      res.status(201).json({
        success: true,
        message:
          "Onboarding task created successfully",
        data: mapTask(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Create onboarding task error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create onboarding task",
      });
    }
  },
);

router.put(
  "/:id/tasks/:taskId",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(req.params.taskId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid task ID",
        });
      }

      const onboarding =
        await getOnboarding(
          req,
          req.params.id,
        );

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding record not found",
        });
      }

      const existing =
        await pool.query(
          `
            SELECT id
            FROM onboarding_tasks
            WHERE id = $1
              AND onboarding_id = $2
            LIMIT 1;
          `,
          [
            req.params.taskId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding task not found",
        });
      }

      const {
        taskName,
        description,
        owner,
        status,
        dueDate,
      } = req.body;

      const validationError =
        validateTask(
          {
            taskName,
            owner,
            status,
            dueDate,
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

      if (taskName !== undefined) {
        addUpdate(
          "task_name",
          taskName.trim(),
        );
      }

      if (description !== undefined) {
        addUpdate(
          "description",
          description?.trim() || null,
        );
      }

      if (owner !== undefined) {
        addUpdate(
          "owner",
          owner?.trim() || null,
        );
      }

      if (status !== undefined) {
        addUpdate(
          "status",
          status.toUpperCase(),
        );
      }

      if (dueDate !== undefined) {
        addUpdate(
          "due_date",
          dueDate,
        );
      }

      if (!updates.length) {
        return res.status(400).json({
          success: false,
          message:
            "At least one field is required",
        });
      }

      if (
        status?.toUpperCase() ===
        "COMPLETED"
      ) {
        updates.push(
          "completed_at = CURRENT_TIMESTAMP",
        );
      } else if (
        status !== undefined
      ) {
        updates.push(
          "completed_at = NULL",
        );
      }

      updates.push(
        "updated_at = CURRENT_TIMESTAMP",
      );

      values.push(req.params.taskId);

      const taskIdParam =
        values.length;

      values.push(req.params.id);

      const onboardingIdParam =
        values.length;

      const result = await pool.query(
        `
          UPDATE onboarding_tasks
          SET ${updates.join(", ")}
          WHERE id = $${taskIdParam}
            AND onboarding_id = $${onboardingIdParam}
          RETURNING
            id,
            onboarding_id,
            task_name,
            description,
            owner,
            status,
            due_date,
            completed_at,
            created_at,
            updated_at;
        `,
        values,
      );

      res.json({
        success: true,
        message:
          "Onboarding task updated successfully",
        data: mapTask(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Update onboarding task error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update onboarding task",
      });
    }
  },
);

router.get(
  "/:id/documents",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid onboarding ID",
        });
      }

      const onboarding =
        await getOnboarding(
          req,
          req.params.id,
        );

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding record not found",
        });
      }

      const result = await pool.query(
        `
          SELECT
            id,
            onboarding_id,
            document_name,
            document_type,
            status,
            verified_by,
            verified_at,
            remarks,
            created_at,
            updated_at
          FROM onboarding_documents
          WHERE onboarding_id = $1
          ORDER BY id ASC;
        `,
        [req.params.id],
      );

      res.json({
        success: true,
        data: result.rows.map(
          mapDocument,
        ),
        total: result.rows.length,
      });
    } catch (error) {
      console.error(
        "Onboarding document list error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to load onboarding documents",
      });
    }
  },
);

router.post(
  "/:id/documents",
  async (req, res) => {
    try {
      if (!isValidId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid onboarding ID",
        });
      }

      const onboarding =
        await getOnboarding(
          req,
          req.params.id,
        );

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding record not found",
        });
      }

      const {
        documentName,
        documentType = "OTHER",
        status = "PENDING",
        verifiedBy = null,
        remarks = null,
      } = req.body;

      const validationError =
        validateDocument({
          documentName,
          documentType,
          status,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const normalizedStatus =
        status.toUpperCase();

      const result = await pool.query(
        `
          INSERT INTO onboarding_documents (
            onboarding_id,
            document_name,
            document_type,
            status,
            verified_by,
            verified_at,
            remarks
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
            onboarding_id,
            document_name,
            document_type,
            status,
            verified_by,
            verified_at,
            remarks,
            created_at,
            updated_at;
        `,
        [
          req.params.id,
          documentName.trim(),
          documentType.toUpperCase(),
          normalizedStatus,
          verifiedBy?.trim() || null,
          normalizedStatus === "VERIFIED"
            ? new Date()
            : null,
          remarks?.trim() || null,
        ],
      );

      res.status(201).json({
        success: true,
        message:
          "Onboarding document created successfully",
        data: mapDocument(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Create onboarding document error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create onboarding document",
      });
    }
  },
);

router.put(
  "/:id/documents/:documentId",
  async (req, res) => {
    try {
      if (
        !isValidId(req.params.id) ||
        !isValidId(
          req.params.documentId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid document ID",
        });
      }

      const onboarding =
        await getOnboarding(
          req,
          req.params.id,
        );

      if (!onboarding) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding record not found",
        });
      }

      const existing =
        await pool.query(
          `
            SELECT id
            FROM onboarding_documents
            WHERE id = $1
              AND onboarding_id = $2
            LIMIT 1;
          `,
          [
            req.params.documentId,
            req.params.id,
          ],
        );

      if (!existing.rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Onboarding document not found",
        });
      }

      const {
        documentName,
        documentType,
        status,
        verifiedBy,
        remarks,
      } = req.body;

      const validationError =
        validateDocument(
          {
            documentName,
            documentType,
            status,
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

      if (
        documentName !== undefined
      ) {
        addUpdate(
          "document_name",
          documentName.trim(),
        );
      }

      if (
        documentType !== undefined
      ) {
        addUpdate(
          "document_type",
          documentType.toUpperCase(),
        );
      }

      if (status !== undefined) {
        addUpdate(
          "status",
          status.toUpperCase(),
        );
      }

      if (verifiedBy !== undefined) {
        addUpdate(
          "verified_by",
          verifiedBy?.trim() || null,
        );
      }

      if (remarks !== undefined) {
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

      if (
        status?.toUpperCase() ===
        "VERIFIED"
      ) {
        updates.push(
          "verified_at = CURRENT_TIMESTAMP",
        );
      } else if (
        status !== undefined
      ) {
        updates.push(
          "verified_at = NULL",
        );
      }

      updates.push(
        "updated_at = CURRENT_TIMESTAMP",
      );

      values.push(
        req.params.documentId,
      );

      const documentIdParam =
        values.length;

      values.push(req.params.id);

      const onboardingIdParam =
        values.length;

      const result = await pool.query(
        `
          UPDATE onboarding_documents
          SET ${updates.join(", ")}
          WHERE id = $${documentIdParam}
            AND onboarding_id = $${onboardingIdParam}
          RETURNING
            id,
            onboarding_id,
            document_name,
            document_type,
            status,
            verified_by,
            verified_at,
            remarks,
            created_at,
            updated_at;
        `,
        values,
      );

      res.json({
        success: true,
        message:
          "Onboarding document updated successfully",
        data: mapDocument(
          result.rows[0],
        ),
      });
    } catch (error) {
      console.error(
        "Update onboarding document error:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update onboarding document",
      });
    }
  },
);
export default router;
