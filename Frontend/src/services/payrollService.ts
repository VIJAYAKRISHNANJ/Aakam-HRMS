import api from "./api";
import axios from "axios";

export type PayrollStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED";

export interface PayrollRun {
  id: number;
  payrollMonth: string;
  status: PayrollStatus;
  pendingApprovals: number;
  createdAt: string;
}

export interface CreatePayrollPayload {
  payrollMonth: string;
  status?: PayrollStatus;
  pendingApprovals?: number;
}

export type UpdatePayrollPayload =
  Partial<CreatePayrollPayload>;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

const request = async <T>(
  requestPromise: Promise<{
    data: ApiResponse<T>;
  }>,
  fallback: string,
): Promise<T> => {
  try {
    const response = await requestPromise;

    if (!response.data.success) {
      throw new Error(
        response.data.message || fallback,
      );
    }

    return response.data.data;
  } catch (error) {
    throw new Error(
      getPayrollErrorMessage(
        error,
        fallback,
      ),
      {
        cause: error,
      },
    );
  }
};

export const getPayrollRuns = (): Promise<
  PayrollRun[]
> =>
  request(
    api.get<ApiResponse<PayrollRun[]>>(
      "/payroll",
    ),
    "Unable to load payroll runs.",
  );

export const getPayrollRun = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    api.get<ApiResponse<PayrollRun>>(
      `/payroll/${id}`,
    ),
    "Unable to load payroll run.",
  );

export const createPayrollRun = (
  payload: CreatePayrollPayload,
): Promise<PayrollRun> =>
  request(
    api.post<ApiResponse<PayrollRun>>(
      "/payroll",
      payload,
    ),
    "Unable to create payroll run.",
  );

export const updatePayrollRun = (
  id: number | string,
  payload: UpdatePayrollPayload,
): Promise<PayrollRun> =>
  request(
    api.put<ApiResponse<PayrollRun>>(
      `/payroll/${id}`,
      payload,
    ),
    "Unable to update payroll run.",
  );

export const deletePayrollRun = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    api.delete<ApiResponse<PayrollRun>>(
      `/payroll/${id}`,
    ),
    "Unable to delete payroll run.",
  );

export const processPayroll = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    api.post<ApiResponse<PayrollRun>>(
      `/payroll/${id}/process`,
    ),
    "Unable to process payroll run.",
  );

export const approvePayroll = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    api.post<ApiResponse<PayrollRun>>(
      `/payroll/${id}/approve`,
    ),
    "Unable to approve payroll run.",
  );

export const completePayroll = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    api.post<ApiResponse<PayrollRun>>(
      `/payroll/${id}/complete`,
    ),
    "Unable to complete payroll run.",
  );

export const getPayrollErrorMessage = (
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
      return "Payroll run not found.";
    }

    if (error.response?.status === 409) {
      return "This payroll action conflicts with the current run state.";
    }
  }

  return error instanceof Error &&
    error.message.trim()
    ? error.message
    : fallback;
};