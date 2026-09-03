import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}

export interface ReportsSummary {
  workforce: {
    totalEmployees: number;
    activeEmployees: number;
  };
  recruitment: {
    totalPositions: number;
    openPositions: number;
    totalCandidates: number;
  };
  onboarding: {
    totalOnboardings: number;
  };
  payroll: {
    totalPayrollRuns: number;
  };
  performance: {
    totalReviews: number;
  };
  training: {
    totalPrograms: number;
    totalEnrollments: number;
  };
}

export interface WorkforceReport {
  totals: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
  };
  byDepartment: {
    id: number;
    name: string;
    code: string;
    employeeCount: number;
  }[];
  byCompany: {
    id: number;
    companyCode: string;
    name: string;
    employeeCount: number | null;
  }[];
  byBranch: {
    id: number;
    companyId: number;
    companyName: string;
    branchCode: string;
    name: string;
    location: string | null;
    employeeCount: number | null;
  }[];
  companyBranchLimitation: string;
}

export interface RecruitmentReport {
  positions: {
    total: number;
    open: number;
    closed: number;
  };
  candidates: {
    total: number;
    hired: number;
    rejected: number;
    byStage: {
      stage: string;
      total: number;
    }[];
  };
}

export interface OnboardingReport {
  total: number;
  initiated: number;
  documentsPending: number;
  verificationPending: number;
  readyToJoin: number;
  joined: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface PayrollReport {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  byMonth: {
    month: string;
    total: number;
  }[];
  approvals: {
    pending: number;
    averagePendingPerRun: number;
  };
}

export interface PerformanceReport {
  total: number;
  draft: number;
  inReview: number;
  completed: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    total: number;
  }[];
  byDepartment: {
    id: number;
    name: string;
    total: number;
  }[];
}

export interface TrainingReport {
  programs: {
    total: number;
    active: number;
    inactive: number;
    byCategory: {
      category: string;
      total: number;
    }[];
  };
  enrollments: {
    total: number;
    completed: number;
    completionRate: number;
  };
  assessmentResults: {
    pass: number;
    fail: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const query = (filters: ReportFilters = {}) => ({
  startDate: filters.startDate || undefined,
  endDate: filters.endDate || undefined,
  departmentId: filters.departmentId || undefined,
});

const request = async <T>(
  promise: Promise<{ data: ApiResponse<T> }>,
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
      getReportsErrorMessage(error, fallback),
      { cause: error },
    );
  }
};

export const getReportsSummary =
  (): Promise<ReportsSummary> =>
    request(
      axios.get<ApiResponse<ReportsSummary>>(
        `${API_URL}/reports/summary`,
      ),
      "Unable to load reports summary.",
    );

export const getWorkforceReport = (
  filters: ReportFilters = {},
): Promise<WorkforceReport> =>
  request(
    axios.get<ApiResponse<WorkforceReport>>(
      `${API_URL}/reports/workforce`,
      {
        params: query(filters),
      },
    ),
    "Unable to load workforce report.",
  );

export const getRecruitmentReport = (
  filters: ReportFilters = {},
): Promise<RecruitmentReport> =>
  request(
    axios.get<ApiResponse<RecruitmentReport>>(
      `${API_URL}/reports/recruitment`,
      {
        params: query(filters),
      },
    ),
    "Unable to load recruitment report.",
  );

export const getOnboardingReport = (
  filters: ReportFilters = {},
): Promise<OnboardingReport> =>
  request(
    axios.get<ApiResponse<OnboardingReport>>(
      `${API_URL}/reports/onboarding`,
      {
        params: query(filters),
      },
    ),
    "Unable to load onboarding report.",
  );

export const getPayrollReport = (
  filters: ReportFilters = {},
): Promise<PayrollReport> =>
  request(
    axios.get<ApiResponse<PayrollReport>>(
      `${API_URL}/reports/payroll`,
      {
        params: {
          startDate:
            filters.startDate || undefined,
          endDate:
            filters.endDate || undefined,
        },
      },
    ),
    "Unable to load payroll report.",
  );

export const getPerformanceReport = (
  filters: ReportFilters = {},
): Promise<PerformanceReport> =>
  request(
    axios.get<ApiResponse<PerformanceReport>>(
      `${API_URL}/reports/performance`,
      {
        params: query(filters),
      },
    ),
    "Unable to load performance report.",
  );

export const getTrainingReport = (
  filters: ReportFilters = {},
): Promise<TrainingReport> =>
  request(
    axios.get<ApiResponse<TrainingReport>>(
      `${API_URL}/reports/training`,
      {
        params: {
          startDate:
            filters.startDate || undefined,
          endDate:
            filters.endDate || undefined,
        },
      },
    ),
    "Unable to load training report.",
  );

export const getReportsErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }

    if (error.response?.status === 400) {
      return "The selected report filters are invalid or unsupported.";
    }

    if (error.response?.status === 500) {
      return "The server could not complete this report request.";
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