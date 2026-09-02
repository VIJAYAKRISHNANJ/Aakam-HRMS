import axios from "axios";

/* ============================================================
   TYPES
============================================================ */

export type PerformanceStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "COMPLETED";

export type GoalStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface PerformanceGoal {
  id: number;
  performanceReviewId: number;
  title: string;
  description: string | null;
  target: string | null;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  id: number;

  employeeId: number;
  employeeName: string;
  employeeCode: string | null;

  department: string;

  reviewerId: number | null;
  reviewerName: string | null;

  reviewPeriodStart: string;
  reviewPeriodEnd: string;

  rating: number | null;

  status: PerformanceStatus;

  createdAt: string;
  updatedAt: string;

  goals: PerformanceGoal[];
}

export interface CreatePerformanceReviewPayload {
  employeeId: number;
  reviewerId?: number | null;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  rating?: number | null;
  status?: PerformanceStatus;
}

export type UpdatePerformanceReviewPayload =
  Partial<CreatePerformanceReviewPayload>;

export interface CreatePerformanceGoalPayload {
  title: string;
  description?: string | null;
  target?: string | null;
  status?: GoalStatus;
}

export interface UpdatePerformanceGoalPayload {
  title?: string;
  description?: string | null;
  target?: string | null;
  status?: GoalStatus;
}

/* ============================================================
   API RESPONSE
============================================================ */

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

/* ============================================================
   API URL
============================================================ */

const API_URL =
  "http://localhost:5000/api/performance";

/* ============================================================
   REQUEST HELPER
============================================================ */

const request = async <T>(
  requestPromise: Promise<{
    data: ApiResponse<T>;
  }>,
  fallback: string,
): Promise<T> => {
  try {
    const response =
      await requestPromise;

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          fallback,
      );
    }

    return response.data.data;
  } catch (error) {
    throw new Error(
      getPerformanceErrorMessage(
        error,
        fallback,
      ),
      {
        cause: error,
      },
    );
  }
};

/* ============================================================
   PERFORMANCE REVIEWS
============================================================ */

export const getPerformanceReviews =
  (): Promise<PerformanceReview[]> =>
    request(
      axios.get<
        ApiResponse<
          PerformanceReview[]
        >
      >(API_URL),
      "Unable to load performance reviews.",
    );

export const getPerformanceReview = (
  id: number | string,
): Promise<PerformanceReview> =>
  request(
    axios.get<
      ApiResponse<PerformanceReview>
    >(
      `${API_URL}/${id}`,
    ),
    "Unable to load performance review.",
  );

export const createPerformanceReview = (
  payload: CreatePerformanceReviewPayload,
): Promise<PerformanceReview> =>
  request(
    axios.post<
      ApiResponse<PerformanceReview>
    >(
      API_URL,
      payload,
    ),
    "Unable to create performance review.",
  );

export const updatePerformanceReview = (
  id: number | string,
  payload: UpdatePerformanceReviewPayload,
): Promise<PerformanceReview> =>
  request(
    axios.put<
      ApiResponse<PerformanceReview>
    >(
      `${API_URL}/${id}`,
      payload,
    ),
    "Unable to update performance review.",
  );

/* ============================================================
   DELETE PERFORMANCE REVIEW
============================================================ */

export const deletePerformanceReview = (
  id: number | string,
): Promise<PerformanceReview> =>
  request(
    axios.delete<
      ApiResponse<PerformanceReview>
    >(
      `${API_URL}/${id}`,
    ),
    "Unable to delete performance review.",
  );

/* ============================================================
   PERFORMANCE GOALS
============================================================ */

export const getPerformanceGoals = (
  reviewId: number | string,
): Promise<PerformanceGoal[]> =>
  request(
    axios.get<
      ApiResponse<PerformanceGoal[]>
    >(
      `${API_URL}/${reviewId}/goals`,
    ),
    "Unable to load performance goals.",
  );

/* ============================================================
   CREATE GOAL
============================================================ */

export const createPerformanceGoal = (
  reviewId: number | string,
  payload: CreatePerformanceGoalPayload,
): Promise<PerformanceGoal> =>
  request(
    axios.post<
      ApiResponse<PerformanceGoal>
    >(
      `${API_URL}/${reviewId}/goals`,
      payload,
    ),
    "Unable to create performance goal.",
  );

/* ============================================================
   UPDATE GOAL
============================================================ */

export const updatePerformanceGoal = (
  reviewId: number | string,
  goalId: number | string,
  payload: UpdatePerformanceGoalPayload,
): Promise<PerformanceGoal> =>
  request(
    axios.put<
      ApiResponse<PerformanceGoal>
    >(
      `${API_URL}/${reviewId}/goals/${goalId}`,
      payload,
    ),
    "Unable to update performance goal.",
  );

/* ============================================================
   DELETE GOAL
============================================================ */

export const deletePerformanceGoal = (
  reviewId: number | string,
  goalId: number | string,
): Promise<PerformanceGoal> =>
  request(
    axios.delete<
      ApiResponse<PerformanceGoal>
    >(
      `${API_URL}/${reviewId}/goals/${goalId}`,
    ),
    "Unable to delete performance goal.",
  );

/* ============================================================
   GOAL STATUS OPTIONS
============================================================ */

export const goalStatuses: GoalStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
];

/* ============================================================
   ERROR HANDLING
============================================================ */

export const getPerformanceErrorMessage = (
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

    if (
      error.response?.status === 400
    ) {
      return "Invalid performance request.";
    }

    if (
      error.response?.status === 404
    ) {
      return "Performance record not found.";
    }

    if (
      error.response?.status === 409
    ) {
      return (
        "This performance action conflicts with the current review state."
      );
    }
  }

  return error instanceof Error &&
    error.message.trim()
    ? error.message
    : fallback;
};