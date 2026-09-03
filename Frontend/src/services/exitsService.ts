import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

const API_URL = `${API_BASE_URL}/exits`;

export const approvalStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export const exitStatuses = [
  "RESIGNATION_SUBMITTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "NOTICE_PERIOD",
  "CLEARANCE",
  "SETTLEMENT",
  "DOCUMENTS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const checklistStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "NOT_APPLICABLE",
] as const;

export const settlementStatuses = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
] as const;

export const documentTypes = [
  "EXPERIENCE_LETTER",
  "RELIEVING_LETTER",
] as const;

export const documentStatuses = [
  "PENDING",
  "ISSUED",
] as const;

export const checklistTypes = [
  "KNOWLEDGE_TRANSFER",
  "ASSET_CLEARANCE",
  "ATTENDANCE_CLEARANCE",
  "LEAVE_CLEARANCE",
  "PAYROLL_CLEARANCE",
  "FULL_AND_FINAL_SETTLEMENT",
  "EXPERIENCE_LETTER",
  "RELIEVING_LETTER",
] as const;

export type ApprovalStatus =
  (typeof approvalStatuses)[number];

export type ExitStatus =
  (typeof exitStatuses)[number];

export type ChecklistStatus =
  (typeof checklistStatuses)[number];

export type SettlementStatus =
  (typeof settlementStatuses)[number];

export type DocumentType =
  (typeof documentTypes)[number];

export type DocumentStatus =
  (typeof documentStatuses)[number];

export interface ExitChecklistItem {
  id: number;
  exitId: number;
  itemType: string;
  status: ChecklistStatus | string;
  owner: string | null;
  completedDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExitSettlement {
  id: number;
  exitId: number;
  status: SettlementStatus | string;
  settlementDate: string | null;
  payableAmount: number;
  deductions: number;
  netSettlement: number;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExitDocument {
  id: number;
  exitId: number;
  documentType: DocumentType | string;
  status: DocumentStatus | string;
  documentDate: string | null;
  reference: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExitRecord {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentId: number | null;
  department: string;
  resignationDate: string;
  exitReason: string;
  noticePeriod: number;
  lastWorkingDate: string;
  approvalStatus: ApprovalStatus | string;
  exitStatus: ExitStatus | string;
  remarks: string | null;
  checklist: ExitChecklistItem[];
  checklistProgress: {
    total: number;
    completed: number;
  };
  settlement: ExitSettlement | null;
  documents: ExitDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface ExitPayload {
  employeeId?: number;
  resignationDate?: string;
  exitReason?: string;
  noticePeriod?: number;
  lastWorkingDate?: string;
  approvalStatus?: ApprovalStatus;
  exitStatus?: ExitStatus;
  remarks?: string | null;
}

export interface ChecklistPayload {
  itemType?: string;
  status?: ChecklistStatus;
  owner?: string | null;
  completedDate?: string | null;
  remarks?: string | null;
}

export interface SettlementPayload {
  status?: SettlementStatus;
  settlementDate?: string | null;
  payableAmount?: number;
  deductions?: number;
  netSettlement?: number;
  remarks?: string | null;
}

export interface DocumentPayload {
  documentType?: DocumentType;
  status?: DocumentStatus;
  documentDate?: string | null;
  reference?: string | null;
  remarks?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const request = async <T>(
  promise: Promise<{
    data: ApiResponse<T>;
  }>,
  fallback: string,
): Promise<T> => {
  try {
    const response = await promise;

    if (!response.data.success) {
      throw new Error(
        response.data.message || fallback,
      );
    }

    return response.data.data;
  } catch (error) {
    throw new Error(
      getExitErrorMessage(error, fallback),
      {
        cause: error,
      },
    );
  }
};

export const getExits = (
  filters: {
    employeeId?: string;
    status?: string;
    approvalStatus?: string;
    exitReason?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<ExitRecord[]> =>
  request(
    axios.get<ApiResponse<ExitRecord[]>>(
      API_URL,
      {
        params: {
          employeeId:
            filters.employeeId || undefined,
          status:
            filters.status || undefined,
          approvalStatus:
            filters.approvalStatus || undefined,
          exitReason:
            filters.exitReason || undefined,
          startDate:
            filters.startDate || undefined,
          endDate:
            filters.endDate || undefined,
        },
      },
    ),
    "Unable to load exit records.",
  );

export const getExit = (
  id: number | string,
): Promise<ExitRecord> =>
  request(
    axios.get<ApiResponse<ExitRecord>>(
      `${API_URL}/${id}`,
    ),
    "Unable to load this exit record.",
  );

export const createExit = (
  payload: ExitPayload,
): Promise<ExitRecord> =>
  request(
    axios.post<ApiResponse<ExitRecord>>(
      API_URL,
      payload,
    ),
    "Failed to create exit record.",
  );

export const updateExit = (
  id: number | string,
  payload: ExitPayload,
): Promise<ExitRecord> =>
  request(
    axios.put<ApiResponse<ExitRecord>>(
      `${API_URL}/${id}`,
      payload,
    ),
    "Failed to update exit record.",
  );

export const getExitChecklist = (
  id: number | string,
): Promise<ExitChecklistItem[]> =>
  request(
    axios.get<
      ApiResponse<ExitChecklistItem[]>
    >(`${API_URL}/${id}/checklist`),
    "Unable to load exit checklist.",
  );

export const createExitChecklist = (
  id: number | string,
  payload: ChecklistPayload,
): Promise<ExitChecklistItem> =>
  request(
    axios.post<
      ApiResponse<ExitChecklistItem>
    >(
      `${API_URL}/${id}/checklist`,
      payload,
    ),
    "Failed to create checklist item.",
  );

export const updateExitChecklist = (
  id: number | string,
  itemId: number | string,
  payload: ChecklistPayload,
): Promise<ExitChecklistItem> =>
  request(
    axios.put<
      ApiResponse<ExitChecklistItem>
    >(
      `${API_URL}/${id}/checklist/${itemId}`,
      payload,
    ),
    "Failed to update checklist item.",
  );

export const getExitSettlement = (
  id: number | string,
): Promise<ExitSettlement | null> =>
  request(
    axios.get<
      ApiResponse<ExitSettlement | null>
    >(`${API_URL}/${id}/settlement`),
    "Unable to load exit settlement.",
  );

export const updateExitSettlement = (
  id: number | string,
  payload: SettlementPayload,
): Promise<ExitSettlement> =>
  request(
    axios.put<
      ApiResponse<ExitSettlement>
    >(
      `${API_URL}/${id}/settlement`,
      payload,
    ),
    "Failed to update settlement.",
  );

export const getExitDocuments = (
  id: number | string,
): Promise<ExitDocument[]> =>
  request(
    axios.get<ApiResponse<ExitDocument[]>>(
      `${API_URL}/${id}/documents`,
    ),
    "Unable to load exit documents.",
  );

export const createExitDocument = (
  id: number | string,
  payload: DocumentPayload,
): Promise<ExitDocument> =>
  request(
    axios.post<ApiResponse<ExitDocument>>(
      `${API_URL}/${id}/documents`,
      payload,
    ),
    "Failed to create exit document.",
  );

export const updateExitDocument = (
  id: number | string,
  documentId: number | string,
  payload: DocumentPayload,
): Promise<ExitDocument> =>
  request(
    axios.put<ApiResponse<ExitDocument>>(
      `${API_URL}/${id}/documents/${documentId}`,
      payload,
    ),
    "Failed to update exit document.",
  );

export const getExitErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }

    if (error.response?.status === 400) {
      return "The submitted exit data is invalid.";
    }

    if (error.response?.status === 404) {
      return "Exit record not found.";
    }

    if (error.response?.status === 409) {
      return "This exit action conflicts with the current workflow.";
    }

    if (error.response?.status === 500) {
      return "The server could not complete this exit request.";
    }
  }

  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};