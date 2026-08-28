import axios from "axios";

const API_URL = "http://localhost:5000/api/performance";

export const performanceStatuses = ["DRAFT", "IN_REVIEW", "COMPLETED"] as const;
export const goalStatuses = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type PerformanceStatus = (typeof performanceStatuses)[number];
export type GoalStatus = (typeof goalStatuses)[number];

export interface PerformanceGoal {
  id: number;
  performanceReviewId: number;
  title: string;
  description: string | null;
  target: string | null;
  status: GoalStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReview {
  id: number;
  employeeId: number;
  employeeCode: string | null;
  employeeName: string;
  departmentId: number | null;
  department: string;
  reviewerId: number | null;
  reviewerName: string | null;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  rating: number | null;
  status: PerformanceStatus | string;
  goals: PerformanceGoal[];
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceReviewPayload {
  employeeId?: number;
  reviewerId?: number | null;
  reviewPeriodStart?: string;
  reviewPeriodEnd?: string;
  rating?: number | null;
  status?: PerformanceStatus;
}

export interface PerformanceGoalPayload {
  title?: string;
  description?: string | null;
  target?: string | null;
  status?: GoalStatus;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const request = async <T>(
  promise: Promise<{ data: ApiResponse<T> }>,
  fallback: string,
): Promise<T> => {
  try {
    const response = await promise;
    if (!response.data.success)
      throw new Error(response.data.message || fallback);
    return response.data.data;
  } catch (error) {
    throw new Error(getPerformanceErrorMessage(error, fallback), {
      cause: error,
    });
  }
};

export const getPerformanceReviews = (): Promise<PerformanceReview[]> =>
  request(
    axios.get<ApiResponse<PerformanceReview[]>>(API_URL),
    "Unable to load performance reviews.",
  );

export const getPerformanceReview = (
  id: number | string,
): Promise<PerformanceReview> =>
  request(
    axios.get<ApiResponse<PerformanceReview>>(`${API_URL}/${id}`),
    "Unable to load this performance review.",
  );

export const createPerformanceReview = (
  payload: PerformanceReviewPayload,
): Promise<PerformanceReview> =>
  request(
    axios.post<ApiResponse<PerformanceReview>>(API_URL, payload),
    "Failed to create performance review.",
  );

export const updatePerformanceReview = (
  id: number | string,
  payload: PerformanceReviewPayload,
): Promise<PerformanceReview> =>
  request(
    axios.put<ApiResponse<PerformanceReview>>(`${API_URL}/${id}`, payload),
    "Failed to update performance review.",
  );

export const getPerformanceGoals = (
  reviewId: number | string,
): Promise<PerformanceGoal[]> =>
  request(
    axios.get<ApiResponse<PerformanceGoal[]>>(`${API_URL}/${reviewId}/goals`),
    "Unable to load performance goals.",
  );

export const createPerformanceGoal = (
  reviewId: number | string,
  payload: PerformanceGoalPayload,
): Promise<PerformanceGoal> =>
  request(
    axios.post<ApiResponse<PerformanceGoal>>(
      `${API_URL}/${reviewId}/goals`,
      payload,
    ),
    "Failed to create performance goal.",
  );

export const updatePerformanceGoal = (
  reviewId: number | string,
  goalId: number | string,
  payload: PerformanceGoalPayload,
): Promise<PerformanceGoal> =>
  request(
    axios.put<ApiResponse<PerformanceGoal>>(
      `${API_URL}/${reviewId}/goals/${goalId}`,
      payload,
    ),
    "Failed to update performance goal.",
  );

export const getPerformanceErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.response?.status === 400)
      return "The submitted performance data is invalid.";
    if (error.response?.status === 404) return "Performance review not found.";
    if (error.response?.status === 409)
      return "This performance action conflicts with the current review state.";
    if (error.response?.status === 500)
      return "The server could not complete this performance request.";
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};
