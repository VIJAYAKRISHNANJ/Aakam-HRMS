import express from "express";
import pool from "../db.js";

const router = express.Router();

const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const EXIT_STATUSES = [
  "RESIGNATION_SUBMITTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "NOTICE_PERIOD",
  "CLEARANCE",
  "SETTLEMENT",
  "DOCUMENTS",
  "COMPLETED",
  "CANCELLED",
];
const CHECKLIST_TYPES = [
  "KNOWLEDGE_TRANSFER",
  "ASSET_CLEARANCE",
  "ATTENDANCE_CLEARANCE",
  "LEAVE_CLEARANCE",
  "PAYROLL_CLEARANCE",
  "FULL_AND_FINAL_SETTLEMENT",
  "EXPERIENCE_LETTER",
  "RELIEVING_LETTER",
];
const CHECKLIST_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "NOT_APPLICABLE"];
const SETTLEMENT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED"];
const DOCUMENT_TYPES = ["EXPERIENCE_LETTER", "RELIEVING_LETTER"];
const DOCUMENT_STATUSES = ["PENDING", "ISSUED"];
const WORKFLOW_ORDER = [
  "RESIGNATION_SUBMITTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "NOTICE_PERIOD",
  "CLEARANCE",
  "SETTLEMENT",
  "DOCUMENTS",
  "COMPLETED",
];

const isValidId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const formatDateOnly = (value) => {
  if (!(value instanceof Date)) return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseMoney = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
};

const checklistItems = CHECKLIST_TYPES.map((itemType) => ({ itemType }));

const mapChecklistItem = (item) => ({
  id: Number(item.id),
  exitId: Number(item.exit_id),
  itemType: item.item_type,
  status: item.status,
  owner: item.owner,
  completedDate: formatDateOnly(item.completed_date),
  remarks: item.remarks,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapSettlement = (settlement) => settlement ? ({
  id: Number(settlement.id),
  exitId: Number(settlement.exit_id),
  status: settlement.status,
  settlementDate: formatDateOnly(settlement.settlement_date),
  payableAmount: Number(settlement.payable_amount),
  deductions: Number(settlement.deductions),
  netSettlement: Number(settlement.net_settlement),
  remarks: settlement.remarks,
  createdAt: settlement.created_at,
  updatedAt: settlement.updated_at,
}) : null;

const mapDocument = (document) => ({
  id: Number(document.id),
  exitId: Number(document.exit_id),
  documentType: document.document_type,
  status: document.status,
  documentDate: formatDateOnly(document.document_date),
  reference: document.reference,
  remarks: document.remarks,
  createdAt: document.created_at,
  updatedAt: document.updated_at,
});

const mapExit = (record, checklist = [], settlement = null, documents = []) => ({
  id: Number(record.id),
  employeeId: Number(record.employee_id),
  employeeCode: record.employee_code,
  employeeName: `${record.first_name} ${record.last_name ?? ""}`.trim(),
  departmentId: record.department_id ? Number(record.department_id) : null,
  department: record.department_name ?? "Unassigned",
  resignationDate: formatDateOnly(record.resignation_date),
  exitReason: record.exit_reason,
  noticePeriod: Number(record.notice_period),
  lastWorkingDate: formatDateOnly(record.last_working_date),
  approvalStatus: record.approval_status,
  exitStatus: record.exit_status,
  remarks: record.remarks,
  checklist,
  checklistProgress: {
    total: checklist.length,
    completed: checklist.filter((item) => ["COMPLETED", "NOT_APPLICABLE"].includes(item.status)).length,
  },
  settlement,
  documents,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const exitSelect = `
  SELECT
    er.id,
    er.employee_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.department_id,
    d.name AS department_name,
    er.resignation_date,
    er.exit_reason,
    er.notice_period,
    er.last_working_date,
    er.approval_status,
    er.exit_status,
    er.remarks,
    er.created_at,
    er.updated_at
  FROM exit_records er
  INNER JOIN employees e ON e.id = er.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
`;

const getExitRecord = async (id, client = pool) => {
  const result = await client.query(`${exitSelect} WHERE er.id = $1 LIMIT 1;`, [id]);
  return result.rows[0];
};

const getRelatedData = async (id, client = pool) => {
  const [checklist, settlement, documents] = await Promise.all([
    client.query("SELECT id, exit_id, item_type, status, owner, completed_date, remarks, created_at, updated_at FROM exit_checklist_items WHERE exit_id = $1 ORDER BY id;", [id]),
    client.query("SELECT id, exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks, created_at, updated_at FROM exit_settlements WHERE exit_id = $1 LIMIT 1;", [id]),
    client.query("SELECT id, exit_id, document_type, status, document_date, reference, remarks, created_at, updated_at FROM exit_documents WHERE exit_id = $1 ORDER BY id;", [id]),
  ]);
  return {
    checklist: checklist.rows.map(mapChecklistItem),
    settlement: mapSettlement(settlement.rows[0]),
    documents: documents.rows.map(mapDocument),
  };
};

const getMappedExit = async (id, client = pool) => {
  const record = await getExitRecord(id, client);
  if (!record) return null;
  const related = await getRelatedData(id, client);
  return mapExit(record, related.checklist, related.settlement, related.documents);
};

const validateExit = ({ employeeId, resignationDate, exitReason, noticePeriod, lastWorkingDate, approvalStatus, exitStatus }, partial = false) => {
  if ((!partial || employeeId !== undefined) && !isValidId(employeeId)) return "Valid employee ID is required";
  if ((!partial || resignationDate !== undefined) && !isValidDate(resignationDate)) return "Resignation date must be a valid date in YYYY-MM-DD format";
  if ((!partial || exitReason !== undefined) && (typeof exitReason !== "string" || !exitReason.trim())) return "Exit reason is required";
  if ((!partial || noticePeriod !== undefined) && (!Number.isInteger(noticePeriod) || noticePeriod < 0)) return "Notice period must be a non-negative whole number";
  if ((!partial || lastWorkingDate !== undefined) && !isValidDate(lastWorkingDate)) return "Last working date must be a valid date in YYYY-MM-DD format";
  if (resignationDate && lastWorkingDate && isValidDate(resignationDate) && isValidDate(lastWorkingDate) && lastWorkingDate < resignationDate) return "Last working date cannot be before resignation date";
  if (approvalStatus !== undefined && (typeof approvalStatus !== "string" || !APPROVAL_STATUSES.includes(approvalStatus.toUpperCase()))) return "Invalid approval status";
  if (exitStatus !== undefined && (typeof exitStatus !== "string" || !EXIT_STATUSES.includes(exitStatus.toUpperCase()))) return "Invalid exit status";
  return null;
};

const validateChecklist = ({ itemType, status, completedDate }, partial = false) => {
  if ((!partial || itemType !== undefined) && (typeof itemType !== "string" || !CHECKLIST_TYPES.includes(itemType.toUpperCase()))) return "Invalid checklist item type";
  if (status !== undefined && (typeof status !== "string" || !CHECKLIST_STATUSES.includes(status.toUpperCase()))) return "Invalid checklist status";
  if (completedDate !== undefined && completedDate !== null && !isValidDate(completedDate)) return "Completed date must be a valid date in YYYY-MM-DD format";
  return null;
};

const validateSettlement = ({ status, settlementDate, payableAmount, deductions, netSettlement }, partial = false) => {
  if (status !== undefined && (typeof status !== "string" || !SETTLEMENT_STATUSES.includes(status.toUpperCase()))) return "Invalid settlement status";
  if (settlementDate !== undefined && settlementDate !== null && !isValidDate(settlementDate)) return "Settlement date must be a valid date in YYYY-MM-DD format";
  for (const [name, value] of [["payable amount", payableAmount], ["deductions", deductions], ["net settlement", netSettlement]]) {
    if ((!partial || value !== undefined) && (!Number.isFinite(parseMoney(value)) || parseMoney(value) < 0)) return `${name} must be a non-negative number`;
  }
  if (payableAmount !== undefined && deductions !== undefined && netSettlement !== undefined && parseMoney(netSettlement) > parseMoney(payableAmount)) return "Net settlement cannot exceed payable amount";
  return null;
};

const validateDocument = ({ documentType, status, documentDate }, partial = false) => {
  if ((!partial || documentType !== undefined) && (typeof documentType !== "string" || !DOCUMENT_TYPES.includes(documentType.toUpperCase()))) return "Invalid exit document type";
  if (status !== undefined && (typeof status !== "string" || !DOCUMENT_STATUSES.includes(status.toUpperCase()))) return "Invalid exit document status";
  if (documentDate !== undefined && documentDate !== null && !isValidDate(documentDate)) return "Document date must be a valid date in YYYY-MM-DD format";
  return null;
};

const validateTransition = (current, next) => {
  if (current === next) return null;
  if (current === "COMPLETED" || current === "CANCELLED") return "Completed or cancelled exits cannot change workflow status";
  if (next === "CANCELLED") return null;
  const currentIndex = WORKFLOW_ORDER.indexOf(current);
  const nextIndex = WORKFLOW_ORDER.indexOf(next);
  if (currentIndex < 0 || nextIndex !== currentIndex + 1) return `Invalid workflow transition from ${current} to ${next}`;
  return null;
};

router.get("/", async (req, res) => {
  try {
    const { employeeId = "", status = "", approvalStatus = "", exitReason = "", startDate = "", endDate = "" } = req.query;
    const values = [];
    const conditions = [];
    if (employeeId) { if (!isValidId(employeeId)) return res.status(400).json({ success: false, message: "Invalid employee ID" }); values.push(Number(employeeId)); conditions.push(`er.employee_id = $${values.length}`); }
    if (status) { const normalized = String(status).toUpperCase(); if (!EXIT_STATUSES.includes(normalized)) return res.status(400).json({ success: false, message: "Invalid exit status" }); values.push(normalized); conditions.push(`er.exit_status = $${values.length}`); }
    if (approvalStatus) { const normalized = String(approvalStatus).toUpperCase(); if (!APPROVAL_STATUSES.includes(normalized)) return res.status(400).json({ success: false, message: "Invalid approval status" }); values.push(normalized); conditions.push(`er.approval_status = $${values.length}`); }
    if (exitReason) { values.push(`%${String(exitReason).trim()}%`); conditions.push(`er.exit_reason ILIKE $${values.length}`); }
    if (startDate) { if (!isValidDate(startDate)) return res.status(400).json({ success: false, message: "Invalid startDate" }); values.push(startDate); conditions.push(`er.resignation_date >= $${values.length}`); }
    if (endDate) { if (!isValidDate(endDate)) return res.status(400).json({ success: false, message: "Invalid endDate" }); values.push(endDate); conditions.push(`er.resignation_date <= $${values.length}`); }
    if (startDate && endDate && startDate > endDate) return res.status(400).json({ success: false, message: "startDate cannot be after endDate" });
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(`${exitSelect} ${whereClause} ORDER BY er.created_at DESC, er.id DESC;`, values);
    const mapped = await Promise.all(result.rows.map(async (record) => { const related = await getRelatedData(record.id); return mapExit(record, related.checklist, related.settlement, related.documents); }));
    res.json({ success: true, data: mapped, total: mapped.length });
  } catch (error) {
    console.error("Exit list error:", error);
    res.status(500).json({ success: false, message: "Failed to load exit records" });
  }
});

router.get("/:id/checklist", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const result = await pool.query("SELECT id, exit_id, item_type, status, owner, completed_date, remarks, created_at, updated_at FROM exit_checklist_items WHERE exit_id = $1 ORDER BY id;", [req.params.id]);
    res.json({ success: true, data: result.rows.map(mapChecklistItem), total: result.rows.length });
  } catch (error) {
    console.error("Exit checklist list error:", error);
    res.status(500).json({ success: false, message: "Failed to load exit checklist" });
  }
});

router.post("/:id/checklist", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const { itemType, item_type: itemTypeSnake, status = "PENDING", owner = null, completedDate = null, completed_date: completedDateSnake, remarks = null } = req.body;
    const fields = { itemType: itemType ?? itemTypeSnake, status, completedDate: completedDate ?? completedDateSnake };
    const validationError = validateChecklist(fields);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const result = await pool.query("INSERT INTO exit_checklist_items (exit_id, item_type, status, owner, completed_date, remarks) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, exit_id, item_type, status, owner, completed_date, remarks, created_at, updated_at;", [req.params.id, fields.itemType.toUpperCase(), fields.status.toUpperCase(), owner?.trim() || null, fields.completedDate, remarks?.trim() || null]);
    res.status(201).json({ success: true, message: "Exit checklist item created successfully", data: mapChecklistItem(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, message: "This checklist item already exists for the exit" });
    console.error("Exit checklist creation error:", error);
    res.status(500).json({ success: false, message: "Failed to create exit checklist item" });
  }
});

router.put("/:id/checklist/:itemId", async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.itemId)) return res.status(400).json({ success: false, message: "Invalid exit or checklist item ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const existing = await pool.query("SELECT id FROM exit_checklist_items WHERE id = $1 AND exit_id = $2 LIMIT 1;", [req.params.itemId, req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: "Exit checklist item not found" });
    const { itemType, item_type: itemTypeSnake, status, owner, completedDate, completed_date: completedDateSnake, remarks } = req.body;
    const fields = { itemType: itemType ?? itemTypeSnake, status, completedDate: completedDate ?? completedDateSnake };
    const validationError = validateChecklist(fields, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => { values.push(value); updates.push(`${column} = $${values.length}`); };
    if (fields.itemType !== undefined) addUpdate("item_type", fields.itemType.toUpperCase());
    if (status !== undefined) addUpdate("status", status.toUpperCase());
    if (owner !== undefined) addUpdate("owner", owner?.trim() || null);
    if (fields.completedDate !== undefined) addUpdate("completed_date", fields.completedDate);
    if (remarks !== undefined) addUpdate("remarks", remarks?.trim() || null);
    if (!updates.length) return res.status(400).json({ success: false, message: "At least one field is required" });
    updates.push("updated_at = CURRENT_TIMESTAMP"); values.push(req.params.itemId);
    const result = await pool.query(`UPDATE exit_checklist_items SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id, exit_id, item_type, status, owner, completed_date, remarks, created_at, updated_at;`, values);
    res.json({ success: true, message: "Exit checklist item updated successfully", data: mapChecklistItem(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, message: "This checklist item already exists for the exit" });
    console.error("Exit checklist update error:", error);
    res.status(500).json({ success: false, message: "Failed to update exit checklist item" });
  }
});

router.get("/:id/settlement", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const result = await pool.query("SELECT id, exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks, created_at, updated_at FROM exit_settlements WHERE exit_id = $1 LIMIT 1;", [req.params.id]);
    res.json({ success: true, data: mapSettlement(result.rows[0]) });
  } catch (error) {
    console.error("Exit settlement detail error:", error);
    res.status(500).json({ success: false, message: "Failed to load exit settlement" });
  }
});

router.put("/:id/settlement", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const currentResult = await pool.query("SELECT id, exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks, created_at, updated_at FROM exit_settlements WHERE exit_id = $1 LIMIT 1;", [req.params.id]);
    const current = currentResult.rows[0];
    const { status, settlementDate, settlement_date: settlementDateSnake, payableAmount, payable_amount: payableAmountSnake, deductions, netSettlement, net_settlement: netSettlementSnake, remarks } = req.body;
    const fields = {
      status,
      settlementDate: settlementDate ?? settlementDateSnake,
      payableAmount: payableAmount ?? payableAmountSnake,
      deductions,
      netSettlement: netSettlement ?? netSettlementSnake,
    };
    const validationError = validateSettlement(fields, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const effectivePayable = fields.payableAmount === undefined
      ? Number(current?.payable_amount ?? 0)
      : parseMoney(fields.payableAmount);
    const effectiveNetSettlement = fields.netSettlement === undefined
      ? Number(current?.net_settlement ?? 0)
      : parseMoney(fields.netSettlement);
    if (effectiveNetSettlement > effectivePayable) {
      return res.status(400).json({ success: false, message: "Net settlement cannot exceed payable amount" });
    }
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => { values.push(value); updates.push(`${column} = $${values.length}`); };
    if (status !== undefined) addUpdate("status", status.toUpperCase());
    if (fields.settlementDate !== undefined) addUpdate("settlement_date", fields.settlementDate);
    if (fields.payableAmount !== undefined) addUpdate("payable_amount", parseMoney(fields.payableAmount));
    if (fields.deductions !== undefined) addUpdate("deductions", parseMoney(fields.deductions));
    if (fields.netSettlement !== undefined) addUpdate("net_settlement", parseMoney(fields.netSettlement));
    if (remarks !== undefined) addUpdate("remarks", remarks?.trim() || null);
    if (!updates.length) return res.status(400).json({ success: false, message: "At least one field is required" });
    updates.push("updated_at = CURRENT_TIMESTAMP");
    if (current) {
      values.push(req.params.id);
      await pool.query(`UPDATE exit_settlements SET ${updates.join(", ")} WHERE exit_id = $${values.length};`, values);
    } else {
      const result = await pool.query("INSERT INTO exit_settlements (exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks) VALUES ($1, COALESCE($2, 'PENDING'), $3, COALESCE($4, 0), COALESCE($5, 0), COALESCE($6, 0), $7) RETURNING id, exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks, created_at, updated_at;", [req.params.id, status?.toUpperCase(), fields.settlementDate ?? null, fields.payableAmount === undefined ? null : parseMoney(fields.payableAmount), fields.deductions === undefined ? null : parseMoney(fields.deductions), fields.netSettlement === undefined ? null : parseMoney(fields.netSettlement), remarks?.trim() || null]);
      return res.status(201).json({ success: true, message: "Exit settlement created successfully", data: mapSettlement(result.rows[0]) });
    }
    const result = await pool.query("SELECT id, exit_id, status, settlement_date, payable_amount, deductions, net_settlement, remarks, created_at, updated_at FROM exit_settlements WHERE exit_id = $1 LIMIT 1;", [req.params.id]);
    res.json({ success: true, message: "Exit settlement updated successfully", data: mapSettlement(result.rows[0]) });
  } catch (error) {
    console.error("Exit settlement update error:", error);
    res.status(500).json({ success: false, message: "Failed to update exit settlement" });
  }
});

router.get("/:id/documents", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const result = await pool.query("SELECT id, exit_id, document_type, status, document_date, reference, remarks, created_at, updated_at FROM exit_documents WHERE exit_id = $1 ORDER BY id;", [req.params.id]);
    res.json({ success: true, data: result.rows.map(mapDocument), total: result.rows.length });
  } catch (error) {
    console.error("Exit document list error:", error);
    res.status(500).json({ success: false, message: "Failed to load exit documents" });
  }
});

router.post("/:id/documents", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    if (!(await getExitRecord(req.params.id))) return res.status(404).json({ success: false, message: "Exit record not found" });
    const { documentType, document_type: documentTypeSnake, status = "PENDING", documentDate, document_date: documentDateSnake, reference = null, remarks = null } = req.body;
    const fields = { documentType: documentType ?? documentTypeSnake, status, documentDate: documentDate ?? documentDateSnake };
    const validationError = validateDocument(fields);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const result = await pool.query("INSERT INTO exit_documents (exit_id, document_type, status, document_date, reference, remarks) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, exit_id, document_type, status, document_date, reference, remarks, created_at, updated_at;", [req.params.id, fields.documentType.toUpperCase(), fields.status.toUpperCase(), fields.documentDate ?? null, reference?.trim() || null, remarks?.trim() || null]);
    res.status(201).json({ success: true, message: "Exit document created successfully", data: mapDocument(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, message: "This exit document already exists" });
    console.error("Exit document creation error:", error);
    res.status(500).json({ success: false, message: "Failed to create exit document" });
  }
});

router.put("/:id/documents/:documentId", async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.documentId)) return res.status(400).json({ success: false, message: "Invalid exit or document ID" });
    const existing = await pool.query("SELECT id FROM exit_documents WHERE id = $1 AND exit_id = $2 LIMIT 1;", [req.params.documentId, req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: "Exit document not found" });
    const { documentType, document_type: documentTypeSnake, status, documentDate, document_date: documentDateSnake, reference, remarks } = req.body;
    const fields = { documentType: documentType ?? documentTypeSnake, status, documentDate: documentDate ?? documentDateSnake };
    const validationError = validateDocument(fields, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const updates = [];
    const values = [];
    const addUpdate = (column, value) => { values.push(value); updates.push(`${column} = $${values.length}`); };
    if (fields.documentType !== undefined) addUpdate("document_type", fields.documentType.toUpperCase());
    if (status !== undefined) addUpdate("status", status.toUpperCase());
    if (fields.documentDate !== undefined) addUpdate("document_date", fields.documentDate);
    if (reference !== undefined) addUpdate("reference", reference?.trim() || null);
    if (remarks !== undefined) addUpdate("remarks", remarks?.trim() || null);
    if (!updates.length) return res.status(400).json({ success: false, message: "At least one field is required" });
    updates.push("updated_at = CURRENT_TIMESTAMP"); values.push(req.params.documentId);
    const result = await pool.query(`UPDATE exit_documents SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING id, exit_id, document_type, status, document_date, reference, remarks, created_at, updated_at;`, values);
    res.json({ success: true, message: "Exit document updated successfully", data: mapDocument(result.rows[0]) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, message: "This exit document already exists" });
    console.error("Exit document update error:", error);
    res.status(500).json({ success: false, message: "Failed to update exit document" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    const exit = await getMappedExit(req.params.id);
    if (!exit) return res.status(404).json({ success: false, message: "Exit record not found" });
    res.json({ success: true, data: exit });
  } catch (error) {
    console.error("Exit detail error:", error);
    res.status(500).json({ success: false, message: "Failed to load exit record" });
  }
});

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { employeeId, employee_id: employeeIdSnake, resignationDate, resignation_date: resignationDateSnake, exitReason, exit_reason: exitReasonSnake, noticePeriod, notice_period: noticePeriodSnake, lastWorkingDate, last_working_date: lastWorkingDateSnake, remarks = null } = req.body;
    const fields = { employeeId: employeeId ?? employeeIdSnake, resignationDate: resignationDate ?? resignationDateSnake, exitReason: exitReason ?? exitReasonSnake, noticePeriod: noticePeriod ?? noticePeriodSnake, lastWorkingDate: lastWorkingDate ?? lastWorkingDateSnake };
    const normalizedNoticePeriod = Number(fields.noticePeriod);
    const validationError = validateExit({ ...fields, noticePeriod: normalizedNoticePeriod });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    await client.query("BEGIN");
    const employee = await client.query("SELECT id FROM employees WHERE id = $1 LIMIT 1;", [fields.employeeId]);
    if (!employee.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ success: false, message: "Employee not found" }); }
    const result = await client.query("INSERT INTO exit_records (employee_id, resignation_date, exit_reason, notice_period, last_working_date, approval_status, exit_status, remarks) VALUES ($1, $2, $3, $4, $5, 'PENDING', 'RESIGNATION_SUBMITTED', $6) RETURNING id;", [fields.employeeId, fields.resignationDate, fields.exitReason.trim(), normalizedNoticePeriod, fields.lastWorkingDate, remarks?.trim() || null]);
    const exitId = result.rows[0].id;
    for (const item of checklistItems) await client.query("INSERT INTO exit_checklist_items (exit_id, item_type) VALUES ($1, $2);", [exitId, item.itemType]);
    await client.query("INSERT INTO exit_settlements (exit_id) VALUES ($1);", [exitId]);
    for (const documentType of DOCUMENT_TYPES) await client.query("INSERT INTO exit_documents (exit_id, document_type) VALUES ($1, $2);", [exitId, documentType]);
    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Exit record created successfully", data: await getMappedExit(exitId) });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(409).json({ success: false, message: "An active exit record already exists for this employee" });
    console.error("Exit creation error:", error);
    res.status(500).json({ success: false, message: "Failed to create exit record" });
  } finally { client.release(); }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid exit ID" });
    const existing = await getExitRecord(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Exit record not found" });
    const { employeeId, employee_id: employeeIdSnake, resignationDate, resignation_date: resignationDateSnake, exitReason, exit_reason: exitReasonSnake, noticePeriod, notice_period: noticePeriodSnake, lastWorkingDate, last_working_date: lastWorkingDateSnake, approvalStatus, approval_status: approvalStatusSnake, exitStatus, exit_status: exitStatusSnake, remarks } = req.body;
    const fields = { employeeId: employeeId ?? employeeIdSnake, resignationDate: resignationDate ?? resignationDateSnake, exitReason: exitReason ?? exitReasonSnake, noticePeriod: noticePeriod === undefined && noticePeriodSnake === undefined ? undefined : Number(noticePeriod ?? noticePeriodSnake), lastWorkingDate: lastWorkingDate ?? lastWorkingDateSnake, approvalStatus: approvalStatus ?? approvalStatusSnake, exitStatus: exitStatus ?? exitStatusSnake };
    const validationError = validateExit(fields, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const nextStatus = fields.exitStatus?.toUpperCase();
    const nextApproval = fields.approvalStatus?.toUpperCase();
    const effectiveResignationDate = fields.resignationDate ?? formatDateOnly(existing.resignation_date);
    const effectiveLastWorkingDate = fields.lastWorkingDate ?? formatDateOnly(existing.last_working_date);
    if (effectiveLastWorkingDate < effectiveResignationDate) return res.status(400).json({ success: false, message: "Last working date cannot be before resignation date" });
    if (nextStatus) { const transitionError = validateTransition(existing.exit_status, nextStatus); if (transitionError) return res.status(409).json({ success: false, message: transitionError }); }
    if (nextStatus === "APPROVED" && (nextApproval ?? existing.approval_status) !== "APPROVED") return res.status(409).json({ success: false, message: "Exit approval status must be APPROVED before entering the approved stage" });
    if (nextApproval === "APPROVED" && existing.exit_status !== "PENDING_APPROVAL" && nextStatus !== "APPROVED") return res.status(409).json({ success: false, message: "Exit must be pending approval before approval" });
    if (nextApproval === "REJECTED" && !["PENDING", "REJECTED"].includes(existing.approval_status)) return res.status(409).json({ success: false, message: "Only pending approvals can be rejected" });
    if (nextApproval === "APPROVED" && !nextStatus) fields.exitStatus = "APPROVED";
    if (nextApproval === "REJECTED" && !nextStatus) fields.exitStatus = "CANCELLED";

    const updates = [];
    const values = [];
    const addUpdate = (column, value) => { values.push(value); updates.push(`${column} = $${values.length}`); };
    if (fields.employeeId !== undefined) { const employee = await pool.query("SELECT id FROM employees WHERE id = $1 LIMIT 1;", [fields.employeeId]); if (!employee.rows.length) return res.status(404).json({ success: false, message: "Employee not found" }); addUpdate("employee_id", fields.employeeId); }
    if (fields.resignationDate !== undefined) addUpdate("resignation_date", fields.resignationDate);
    if (fields.exitReason !== undefined) addUpdate("exit_reason", fields.exitReason.trim());
    if (fields.noticePeriod !== undefined) addUpdate("notice_period", fields.noticePeriod);
    if (fields.lastWorkingDate !== undefined) addUpdate("last_working_date", fields.lastWorkingDate);
    if (fields.approvalStatus !== undefined) addUpdate("approval_status", fields.approvalStatus.toUpperCase());
    if (fields.exitStatus !== undefined) addUpdate("exit_status", fields.exitStatus.toUpperCase());
    if (remarks !== undefined) addUpdate("remarks", remarks?.trim() || null);
    if (!updates.length) return res.status(400).json({ success: false, message: "At least one field is required" });
    updates.push("updated_at = CURRENT_TIMESTAMP"); values.push(req.params.id);
    await pool.query(`UPDATE exit_records SET ${updates.join(", ")} WHERE id = $${values.length};`, values);
    res.json({ success: true, message: "Exit record updated successfully", data: await getMappedExit(req.params.id) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, message: "An active exit record already exists for this employee" });
    console.error("Exit update error:", error);
    res.status(500).json({ success: false, message: "Failed to update exit record" });
  }
});

export default router;
