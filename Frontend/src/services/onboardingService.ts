import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Onboarding Statuses
|--------------------------------------------------------------------------
*/

export const onboardingStatuses = [
  "INITIATED",
  "DOCUMENTS_PENDING",
  "VERIFICATION_PENDING",
  "READY_TO_JOIN",
  "JOINED",
  "ALLOCATION_PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OnboardingStatus =
  (typeof onboardingStatuses)[number];

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

export type DocumentStatus =
  | "PENDING"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED";

export type DocumentType =
  | "RESUME"
  | "IDENTITY_PROOF"
  | "ADDRESS_PROOF"
  | "EDUCATIONAL_CERTIFICATE"
  | "EXPERIENCE_CERTIFICATE"
  | "OFFER_DOCUMENTATION"
  | "OTHER";

/*
|--------------------------------------------------------------------------
| Progress
|--------------------------------------------------------------------------
*/

export interface Progress {
  total: number;
  completed: number;
}

/*
|--------------------------------------------------------------------------
| Onboarding Record
|--------------------------------------------------------------------------
*/

export interface OnboardingRecord {
  id: number;
  onboardingCode: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobPosition: string | null;
  recruitmentStage: string;
  employeeId: number | null;
  employeeCode: string | null;
  expectedJoiningDate: string;
  actualJoiningDate: string | null;
  departmentId: number | null;
  department: string;
  status: OnboardingStatus | string;
  documentVerificationStatus: string;
  assetAllocationStatus: string;
  systemAccessStatus: string;
  completionDate: string | null;
  documentProgress: Progress;
  checklistProgress: Progress;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Onboarding Task
|--------------------------------------------------------------------------
*/

export interface OnboardingTask {
  id: number;
  onboardingId: number;
  taskName: string;
  description: string | null;
  owner: string | null;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Onboarding Document
|--------------------------------------------------------------------------
*/

export interface OnboardingDocument {
  id: number;
  onboardingId: number;
  documentName: string;
  documentType: DocumentType | string;
  status: DocumentStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Onboarding Detail
|--------------------------------------------------------------------------
*/

export interface OnboardingDetail
  extends OnboardingRecord {
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
}

/*
|--------------------------------------------------------------------------
| Payloads
|--------------------------------------------------------------------------
*/

export interface OnboardingPayload {
  onboardingCode?: string;
  candidateId?: number;
  expectedJoiningDate?: string;
  actualJoiningDate?: string | null;
  departmentId?: number;
  status?: OnboardingStatus | string;
  documentVerificationStatus?: string;
  assetAllocationStatus?: string;
  systemAccessStatus?: string;
}

export interface TaskPayload {
  taskName?: string;
  description?: string | null;
  owner?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
}

export interface DocumentPayload {
  documentName?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  verifiedBy?: string | null;
  remarks?: string | null;
}

export interface EmployeePayload {
  employeeCode: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employmentStatus?: string;
  employmentType?: string;
  joiningDate?: string;
}

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* =========================================================
   ONBOARDING
========================================================= */

/*
| GET /api/onboarding
*/

export const getOnboardings = async (
  filters: {
    search?: string;
    status?: string;
  } = {},
): Promise<OnboardingRecord[]> => {
  const response =
    await axios.get<
      ApiResponse<OnboardingRecord[]>
    >(API_URL + "/onboarding", {
      params: {
        search:
          filters.search ||
          undefined,

        status:
          filters.status ||
          undefined,
      },
    });

  return response.data.data;
};

/*
| GET /api/onboarding/:id
*/

export const getOnboarding = async (
  id: number | string,
): Promise<OnboardingDetail> => {
  const response =
    await axios.get<
      ApiResponse<OnboardingDetail>
    >(`${API_URL}/onboarding/${id}`);

  return response.data.data;
};

/*
| POST /api/onboarding
*/

export const createOnboarding = async (
  payload: OnboardingPayload,
): Promise<OnboardingRecord> => {
  const response =
    await axios.post<
      ApiResponse<OnboardingRecord>
    >(`${API_URL}/onboarding`, payload);

  return response.data.data;
};

/*
| PUT /api/onboarding/:id
*/

export const updateOnboarding = async (
  id: number | string,
  payload: OnboardingPayload,
): Promise<OnboardingRecord> => {
  const response =
    await axios.put<
      ApiResponse<OnboardingRecord>
    >(
      `${API_URL}/onboarding/${id}`,
      payload,
    );

  return response.data.data;
};

/*
| DELETE /api/onboarding/:id
*/

export const deleteOnboarding = async (
  id: number | string,
): Promise<void> => {
  await axios.delete(
    `${API_URL}/onboarding/${id}`,
  );
};

/* =========================================================
   TASKS
========================================================= */

/*
| GET /api/onboarding/:id/tasks
*/

export const getOnboardingTasks = async (
  id: number | string,
): Promise<OnboardingTask[]> => {
  const response =
    await axios.get<
      ApiResponse<OnboardingTask[]>
    >(
      `${API_URL}/onboarding/${id}/tasks`,
    );

  return response.data.data;
};

/*
| POST /api/onboarding/:id/tasks
*/

export const createOnboardingTask = async (
  id: number | string,
  payload: TaskPayload,
): Promise<OnboardingTask> => {
  const response =
    await axios.post<
      ApiResponse<OnboardingTask>
    >(
      `${API_URL}/onboarding/${id}/tasks`,
      payload,
    );

  return response.data.data;
};

/*
| PUT /api/onboarding/:id/tasks/:taskId
*/

export const updateOnboardingTask = async (
  id: number | string,
  taskId: number,
  payload: TaskPayload,
): Promise<OnboardingTask> => {
  const response =
    await axios.put<
      ApiResponse<OnboardingTask>
    >(
      `${API_URL}/onboarding/${id}/tasks/${taskId}`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Delete an onboarding checklist/task.
|--------------------------------------------------------------------------
*/

export const deleteOnboardingTask = async (
  id: number | string,
  taskId: number,
): Promise<void> => {
  await axios.delete(
    `${API_URL}/onboarding/${id}/tasks/${taskId}`,
  );
};

/* =========================================================
   DOCUMENTS
========================================================= */

/*
| GET /api/onboarding/:id/documents
*/

export const getOnboardingDocuments =
  async (
    id: number | string,
  ): Promise<OnboardingDocument[]> => {
    const response =
      await axios.get<
        ApiResponse<OnboardingDocument[]>
      >(
        `${API_URL}/onboarding/${id}/documents`,
      );

    return response.data.data;
  };

/*
| POST /api/onboarding/:id/documents
*/

export const createOnboardingDocument =
  async (
    id: number | string,
    payload: DocumentPayload,
  ): Promise<OnboardingDocument> => {
    const response =
      await axios.post<
        ApiResponse<OnboardingDocument>
      >(
        `${API_URL}/onboarding/${id}/documents`,
        payload,
      );

    return response.data.data;
  };

/*
| PUT /api/onboarding/:id/documents/:documentId
*/

export const updateOnboardingDocument =
  async (
    id: number | string,
    documentId: number,
    payload: DocumentPayload,
  ): Promise<OnboardingDocument> => {
    const response =
      await axios.put<
        ApiResponse<OnboardingDocument>
      >(
        `${API_URL}/onboarding/${id}/documents/${documentId}`,
        payload,
      );

    return response.data.data;
  };

/*
|--------------------------------------------------------------------------
| Delete an onboarding document.
|--------------------------------------------------------------------------
*/

export const deleteOnboardingDocument =
  async (
    id: number | string,
    documentId: number,
  ): Promise<void> => {
    await axios.delete(
      `${API_URL}/onboarding/${id}/documents/${documentId}`,
    );
  };

/* =========================================================
   JOIN / EMPLOYEE / COMPLETE
========================================================= */

/*
| POST /api/onboarding/:id/join
*/

export const joinOnboarding = async (
  id: number | string,
  actualJoiningDate?: string,
): Promise<OnboardingRecord> => {
  const response =
    await axios.post<
      ApiResponse<OnboardingRecord>
    >(
      `${API_URL}/onboarding/${id}/join`,
      {
        actualJoiningDate,
      },
    );

  return response.data.data;
};

/*
| POST /api/onboarding/:id/create-employee
*/

export const createOnboardingEmployee =
  async (
    id: number | string,
    payload: EmployeePayload,
  ) => {
    const response =
      await axios.post<
        ApiResponse<{
          employee: unknown;
          onboarding: OnboardingRecord;
        }>
      >(
        `${API_URL}/onboarding/${id}/create-employee`,
        payload,
      );

    return response.data.data;
  };

/*
| POST /api/onboarding/:id/complete
*/

export const completeOnboarding = async (
  id: number | string,
): Promise<OnboardingRecord> => {
  const response =
    await axios.post<
      ApiResponse<OnboardingRecord>
    >(
      `${API_URL}/onboarding/${id}/complete`,
    );

  return response.data.data;
};

/* =========================================================
   ERROR HANDLING
========================================================= */

export const getOnboardingErrorMessage = (
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

    if (error.response?.status === 404) {
      return "Onboarding record not found.";
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