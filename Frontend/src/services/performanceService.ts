import api from "./api";

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

/*
 * Some performance endpoints currently return:
 *
 * {
 *   success: true,
 *   data: [...]
 * }
 *
 * while the GET /performance endpoint can return:
 *
 * [...]
 *
 * The helper below supports BOTH response formats.
 */

type ApiResult<T> =
  | ApiResponse<T>
  | T;

/* ============================================================
   REQUEST HELPER
============================================================ */

const request = async <T>(
  requestPromise: Promise<{
    data: ApiResult<T>;
  }>,
  fallback: string,
): Promise<T> => {
  try {
    const response =
      await requestPromise;

    const responseData =
      response.data;

    /*
     * Standard API response:
     *
     * {
     *   success: true,
     *   data: ...
     * }
     */

    if (
      responseData &&
      typeof responseData ===
        "object" &&
      "success" in
        responseData
    ) {
      const standardResponse =
        responseData as ApiResponse<T>;

      if (
        !standardResponse.success
      ) {
        throw new Error(
          standardResponse.message ||
            fallback,
        );
      }

      return standardResponse.data;
    }

    /*
     * Raw API response:
     *
     * [...]
     *
     * Return it directly.
     */

    return responseData as T;
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
  (): Promise<
    PerformanceReview[]
  > =>
    request(
      api.get<
        ApiResult<
          PerformanceReview[]
        >
      >("/performance"),
      "Unable to load performance reviews.",
    );

export const getPerformanceReview = (
  id: number | string,
): Promise<PerformanceReview> =>
  request(
    api.get<
      ApiResult<PerformanceReview>
    >(
      `/performance/${id}`,
    ),
    "Unable to load performance review.",
  );

export const createPerformanceReview =
  (
    payload: CreatePerformanceReviewPayload,
  ): Promise<PerformanceReview> =>
    request(
      api.post<
        ApiResult<PerformanceReview>
      >(
        "/performance",
        payload,
      ),
      "Unable to create performance review.",
    );

export const updatePerformanceReview =
  (
    id: number | string,
    payload: UpdatePerformanceReviewPayload,
  ): Promise<PerformanceReview> =>
    request(
      api.put<
        ApiResult<PerformanceReview>
      >(
        `/performance/${id}`,
        payload,
      ),
      "Unable to update performance review.",
    );

/* ============================================================
   DELETE PERFORMANCE REVIEW
============================================================ */

export const deletePerformanceReview =
  (
    id: number | string,
  ): Promise<PerformanceReview> =>
    request(
      api.delete<
        ApiResult<PerformanceReview>
      >(
        `/performance/${id}`,
      ),
      "Unable to delete performance review.",
    );

/* ============================================================
   PERFORMANCE GOALS
============================================================ */

export const getPerformanceGoals =
  (
    reviewId: number | string,
  ): Promise<PerformanceGoal[]> =>
    request(
      api.get<
        ApiResult<PerformanceGoal[]>
      >(
        `/performance/${reviewId}/goals`,
      ),
      "Unable to load performance goals.",
    );

/* ============================================================
   CREATE GOAL
============================================================ */

export const createPerformanceGoal =
  (
    reviewId: number | string,
    payload: CreatePerformanceGoalPayload,
  ): Promise<PerformanceGoal> =>
    request(
      api.post<
        ApiResult<PerformanceGoal>
      >(
        `/performance/${reviewId}/goals`,
        payload,
      ),
      "Unable to create performance goal.",
    );

/* ============================================================
   UPDATE GOAL
============================================================ */

export const updatePerformanceGoal =
  (
    reviewId: number | string,
    goalId: number | string,
    payload: UpdatePerformanceGoalPayload,
  ): Promise<PerformanceGoal> =>
    request(
      api.put<
        ApiResult<PerformanceGoal>
      >(
        `/performance/${reviewId}/goals/${goalId}`,
        payload,
      ),
      "Unable to update performance goal.",
    );

/* ============================================================
   DELETE GOAL
============================================================ */

export const deletePerformanceGoal =
  (
    reviewId: number | string,
    goalId: number | string,
  ): Promise<PerformanceGoal> =>
    request(
      api.delete<
        ApiResult<PerformanceGoal>
      >(
        `/performance/${reviewId}/goals/${goalId}`,
      ),
      "Unable to delete performance goal.",
    );

/* ============================================================
   GOAL STATUS OPTIONS
============================================================ */

export const goalStatuses: GoalStatus[] =
  [
    "NOT_STARTED",
    "IN_PROGRESS",
    "COMPLETED",
  ];

/* ============================================================
   ERROR HANDLING
============================================================ */

export const getPerformanceErrorMessage =
  (
    error: unknown,
    fallback: string,
  ): string => {
    if (
      axios.isAxiosError(error)
    ) {
      const message =
        error.response?.data
          ?.message;

      if (
        typeof message ===
          "string" &&
        message.trim()
      ) {
        return message;
      }

      if (
        error.response?.status ===
        400
      ) {
        return "Invalid performance request.";
      }

      if (
        error.response?.status ===
        401
      ) {
        return "Your session has expired. Please sign in again.";
      }

      if (
        error.response?.status ===
        403
      ) {
        return "You do not have permission to access performance reviews.";
      }

      if (
        error.response?.status ===
        404
      ) {
        return "Performance record not found.";
      }

      if (
        error.response?.status ===
        409
      ) {
        return (
          "This performance action conflicts with the current review state."
        );
      }

      if (
        error.response?.status &&
        error.response.status >= 500
      ) {
        return "The server encountered an error while processing the performance request.";
      }
    }

    return error instanceof Error &&
      error.message.trim()
      ? error.message
      : fallback;
  };