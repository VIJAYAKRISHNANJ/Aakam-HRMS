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

export type SalaryStatus =
  | "ACTIVE"
  | "INACTIVE";

export interface EmployeeSalary {
  id: number;
  employeeId: number;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;

  companyId: number;

  annualCtc: number;
  monthlyGross: number;
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  totalDeductions: number;
  netSalary: number;

  effectiveFrom: string;
  effectiveTo?: string | null;

  status: SalaryStatus;

  revisionReason?: string | null;
  remarks?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryPayload {
  employeeId: number;

  annualCtc: number;
  monthlyGross: number;
  basicSalary: number;
  hra: number;
  otherAllowances: number;
  totalDeductions: number;
  netSalary: number;

  effectiveFrom: string;
  effectiveTo?: string | null;

  status?: SalaryStatus;

  revisionReason?: string;
  remarks?: string;
}

export type UpdateSalaryPayload =
  Partial<Omit<CreateSalaryPayload, "employeeId">>;

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

/* =========================================================
   PAYROLL RUNS
   ========================================================= */

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

/* =========================================================
   EMPLOYEE SALARIES
   ========================================================= */

/**
 * Get salary records visible to the authenticated user.
 *
 * For administrators this can return company-scoped
 * salary records.
 *
 * For own-only roles the backend applies the employee
 * ownership restriction.
 */
export const getEmployeeSalaries = (): Promise<
  EmployeeSalary[]
> =>
  request(
    api.get<ApiResponse<EmployeeSalary[]>>(
      "/payroll/salaries",
    ),
    "Unable to load employee salaries.",
  );

/**
 * Get the current/latest salary for one employee.
 */
export const getEmployeeSalary = (
  employeeId: number | string,
): Promise<EmployeeSalary> =>
  request(
    api.get<ApiResponse<EmployeeSalary>>(
      `/payroll/salaries/${employeeId}`,
    ),
    "Unable to load employee salary.",
  );

/**
 * Get complete salary revision history for one employee.
 */
export const getEmployeeSalaryHistory = (
  employeeId: number | string,
): Promise<EmployeeSalary[]> =>
  request(
    api.get<ApiResponse<EmployeeSalary[]>>(
      `/payroll/salaries/${employeeId}/history`,
    ),
    "Unable to load salary history.",
  );

/**
 * Create a new salary/revision.
 *
 * The backend derives and validates company ownership
 * from the authenticated employee/company scope.
 */
export const createEmployeeSalary = (
  payload: CreateSalaryPayload,
): Promise<EmployeeSalary> =>
  request(
    api.post<ApiResponse<EmployeeSalary>>(
      "/payroll/salaries",
      payload,
    ),
    "Unable to create employee salary.",
  );

/**
 * Update an existing salary record.
 */
export const updateEmployeeSalary = (
  id: number | string,
  payload: UpdateSalaryPayload,
): Promise<EmployeeSalary> =>
  request(
    api.put<ApiResponse<EmployeeSalary>>(
      `/payroll/salaries/${id}`,
      payload,
    ),
    "Unable to update employee salary.",
  );

/**
 * Delete a salary record.
 */
export const deleteEmployeeSalary = (
  id: number | string,
): Promise<EmployeeSalary> =>
  request(
    api.delete<ApiResponse<EmployeeSalary>>(
      `/payroll/salaries/${id}`,
    ),
    "Unable to delete employee salary.",
  );

/* =========================================================
   ERROR HANDLING
   ========================================================= */

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

    if (error.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to perform this payroll action.";
    }

    if (error.response?.status === 404) {
      return "The requested payroll record was not found.";
    }

    if (error.response?.status === 409) {
      return "This payroll action conflicts with the current record state.";
    }
  }

  return error instanceof Error &&
    error.message.trim()
    ? error.message
    : fallback;
};