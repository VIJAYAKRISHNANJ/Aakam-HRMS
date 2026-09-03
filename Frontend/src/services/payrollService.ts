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

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api/payroll";

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
    axios.get<ApiResponse<PayrollRun[]>>(
      API_URL,
    ),
    "Unable to load payroll runs.",
  );

export const getPayrollRun = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    axios.get<ApiResponse<PayrollRun>>(
      `${API_URL}/${id}`,
    ),
    "Unable to load payroll run.",
  );

export const createPayrollRun = (
  payload: CreatePayrollPayload,
): Promise<PayrollRun> =>
  request(
    axios.post<ApiResponse<PayrollRun>>(
      API_URL,
      payload,
    ),
    "Unable to create payroll run.",
  );

export const updatePayrollRun = (
  id: number | string,
  payload: UpdatePayrollPayload,
): Promise<PayrollRun> =>
  request(
    axios.put<ApiResponse<PayrollRun>>(
      `${API_URL}/${id}`,
      payload,
    ),
    "Unable to update payroll run.",
  );

export const deletePayrollRun = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    axios.delete<ApiResponse<PayrollRun>>(
      `${API_URL}/${id}`,
    ),
    "Unable to delete payroll run.",
  );

export const processPayroll = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    axios.post<ApiResponse<PayrollRun>>(
      `${API_URL}/${id}/process`,
    ),
    "Unable to process payroll run.",
  );

export const approvePayroll = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    axios.post<ApiResponse<PayrollRun>>(
      `${API_URL}/${id}/approve`,
    ),
    "Unable to approve payroll run.",
  );

export const completePayroll = (
  id: number | string,
): Promise<PayrollRun> =>
  request(
    axios.post<ApiResponse<PayrollRun>>(
      `${API_URL}/${id}/complete`,
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