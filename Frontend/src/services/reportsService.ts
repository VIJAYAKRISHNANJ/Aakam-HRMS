import api from "./api";
import axios from "axios";

/* ============================================================
   TYPES
============================================================ */

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

/* ============================================================
   API RESPONSE
============================================================ */

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (
  value: unknown,
  fallback = 0,
): number => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const toStringValue = (
  value: unknown,
  fallback = "",
): string => {
  return typeof value === "string"
    ? value
    : value == null
      ? fallback
      : String(value);
};

const toNullableNumber = (
  value: unknown,
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const toNullableString = (
  value: unknown,
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
};

const query = (
  filters: ReportFilters = {},
) => ({
  startDate:
    filters.startDate || undefined,

  endDate:
    filters.endDate || undefined,

  departmentId:
    filters.departmentId || undefined,
});

/* ============================================================
   RESPONSE NORMALIZERS
============================================================ */

const normalizeReportsSummary = (
  value: unknown,
): ReportsSummary => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  const workforce =
    data.workforce ?? {};

  const recruitment =
    data.recruitment ?? {};

  const onboarding =
    data.onboarding ?? {};

  const payroll =
    data.payroll ?? {};

  const performance =
    data.performance ?? {};

  const training =
    data.training ?? {};

  return {
    workforce: {
      totalEmployees:
        toNumber(workforce.totalEmployees),

      activeEmployees:
        toNumber(workforce.activeEmployees),
    },

    recruitment: {
      totalPositions:
        toNumber(recruitment.totalPositions),

      openPositions:
        toNumber(recruitment.openPositions),

      totalCandidates:
        toNumber(recruitment.totalCandidates),
    },

    onboarding: {
      totalOnboardings:
        toNumber(onboarding.totalOnboardings),
    },

    payroll: {
      totalPayrollRuns:
        toNumber(payroll.totalPayrollRuns),
    },

    performance: {
      totalReviews:
        toNumber(performance.totalReviews),
    },

    training: {
      totalPrograms:
        toNumber(training.totalPrograms),

      totalEnrollments:
        toNumber(training.totalEnrollments),
    },
  };
};

const normalizeWorkforceReport = (
  value: unknown,
): WorkforceReport => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  const totals =
    data.totals ?? {};

  const byDepartment =
    Array.isArray(data.byDepartment)
      ? data.byDepartment
      : [];

  const byCompany =
    Array.isArray(data.byCompany)
      ? data.byCompany
      : [];

  const byBranch =
    Array.isArray(data.byBranch)
      ? data.byBranch
      : [];

  return {
    totals: {
      totalEmployees:
        toNumber(totals.totalEmployees),

      activeEmployees:
        toNumber(totals.activeEmployees),

      inactiveEmployees:
        toNumber(totals.inactiveEmployees),
    },

    byDepartment:
      byDepartment.map(
        (item: any) => ({
          id: toNumber(item?.id),

          name:
            toStringValue(item?.name),

          code:
            toStringValue(item?.code),

          employeeCount:
            toNumber(item?.employeeCount),
        }),
      ),

    byCompany:
      byCompany.map(
        (item: any) => ({
          id: toNumber(item?.id),

          companyCode:
            toStringValue(item?.companyCode),

          name:
            toStringValue(item?.name),

          employeeCount:
            toNullableNumber(
              item?.employeeCount,
            ),
        }),
      ),

    byBranch:
      byBranch.map(
        (item: any) => ({
          id: toNumber(item?.id),

          companyId:
            toNumber(item?.companyId),

          companyName:
            toStringValue(item?.companyName),

          branchCode:
            toStringValue(item?.branchCode),

          name:
            toStringValue(item?.name),

          location:
            toNullableString(item?.location),

          employeeCount:
            toNullableNumber(
              item?.employeeCount,
            ),
        }),
      ),

    companyBranchLimitation:
      toStringValue(
        data.companyBranchLimitation,
      ),
  };
};

const normalizeRecruitmentReport = (
  value: unknown,
): RecruitmentReport => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  const positions =
    data.positions ?? {};

  const candidates =
    data.candidates ?? {};

  const byStage =
    Array.isArray(candidates.byStage)
      ? candidates.byStage
      : [];

  return {
    positions: {
      total:
        toNumber(positions.total),

      open:
        toNumber(positions.open),

      closed:
        toNumber(positions.closed),
    },

    candidates: {
      total:
        toNumber(candidates.total),

      hired:
        toNumber(candidates.hired),

      rejected:
        toNumber(candidates.rejected),

      byStage:
        byStage.map(
          (item: any) => ({
            stage:
              toStringValue(item?.stage),

            total:
              toNumber(item?.total),
          }),
        ),
    },
  };
};

const normalizeOnboardingReport = (
  value: unknown,
): OnboardingReport => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  return {
    total:
      toNumber(data.total),

    initiated:
      toNumber(data.initiated),

    documentsPending:
      toNumber(data.documentsPending),

    verificationPending:
      toNumber(data.verificationPending),

    readyToJoin:
      toNumber(data.readyToJoin),

    joined:
      toNumber(data.joined),

    inProgress:
      toNumber(data.inProgress),

    completed:
      toNumber(data.completed),

    cancelled:
      toNumber(data.cancelled),
  };
};

const normalizePayrollReport = (
  value: unknown,
): PayrollReport => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  const approvals =
    data.approvals ?? {};

  const byMonth =
    Array.isArray(data.byMonth)
      ? data.byMonth
      : [];

  return {
    total:
      toNumber(data.total),

    pending:
      toNumber(data.pending),

    processing:
      toNumber(data.processing),

    completed:
      toNumber(data.completed),

    byMonth:
      byMonth.map(
        (item: any) => ({
          month:
            toStringValue(item?.month),

          total:
            toNumber(item?.total),
        }),
      ),

    approvals: {
      pending:
        toNumber(approvals.pending),

      averagePendingPerRun:
        toNumber(
          approvals.averagePendingPerRun,
        ),
    },
  };
};

const normalizePerformanceReport = (
  value: unknown,
): PerformanceReport => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  const ratingDistribution =
    Array.isArray(data.ratingDistribution)
      ? data.ratingDistribution
      : [];

  const byDepartment =
    Array.isArray(data.byDepartment)
      ? data.byDepartment
      : [];

  return {
    total:
      toNumber(data.total),

    draft:
      toNumber(data.draft),

    inReview:
      toNumber(data.inReview),

    completed:
      toNumber(data.completed),

    averageRating:
      toNumber(data.averageRating),

    ratingDistribution:
      ratingDistribution.map(
        (item: any) => ({
          rating:
            toNumber(item?.rating),

          total:
            toNumber(item?.total),
        }),
      ),

    byDepartment:
      byDepartment.map(
        (item: any) => ({
          id:
            toNumber(item?.id),

          name:
            toStringValue(item?.name),

          total:
            toNumber(item?.total),
        }),
      ),
  };
};

const normalizeTrainingReport = (
  value: unknown,
): TrainingReport => {
  const data =
    value &&
    typeof value === "object"
      ? value as Record<string, any>
      : {};

  const programs =
    data.programs ?? {};

  const enrollments =
    data.enrollments ?? {};

  const assessmentResults =
    data.assessmentResults ?? {};

  const byCategory =
    Array.isArray(programs.byCategory)
      ? programs.byCategory
      : [];

  return {
    programs: {
      total:
        toNumber(programs.total),

      active:
        toNumber(programs.active),

      inactive:
        toNumber(programs.inactive),

      byCategory:
        byCategory.map(
          (item: any) => ({
            category:
              toStringValue(item?.category),

            total:
              toNumber(item?.total),
          }),
        ),
    },

    enrollments: {
      total:
        toNumber(enrollments.total),

      completed:
        toNumber(enrollments.completed),

      completionRate:
        toNumber(enrollments.completionRate),
    },

    assessmentResults: {
      pass:
        toNumber(assessmentResults.pass),

      fail:
        toNumber(assessmentResults.fail),
    },
  };
};

/* ============================================================
   REQUEST HELPER
============================================================ */

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
        response.data.message ||
          fallback,
      );
    }

    return response.data.data;
  } catch (error) {
    throw new Error(
      getReportsErrorMessage(
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
   REPORTS SUMMARY
============================================================ */

export const getReportsSummary =
  (): Promise<ReportsSummary> =>
    request(
      api.get<ApiResponse<ReportsSummary>>(
        "/reports/summary",
      ),
      "Unable to load reports summary.",
    ).then(normalizeReportsSummary);

/* ============================================================
   WORKFORCE REPORT
============================================================ */

export const getWorkforceReport = (
  filters: ReportFilters = {},
): Promise<WorkforceReport> =>
  request(
    api.get<ApiResponse<WorkforceReport>>(
      "/reports/workforce",
      {
        params: query(filters),
      },
    ),
    "Unable to load workforce report.",
  ).then(normalizeWorkforceReport);

/* ============================================================
   RECRUITMENT REPORT
============================================================ */

export const getRecruitmentReport = (
  filters: ReportFilters = {},
): Promise<RecruitmentReport> =>
  request(
    api.get<ApiResponse<RecruitmentReport>>(
      "/reports/recruitment",
      {
        params: query(filters),
      },
    ),
    "Unable to load recruitment report.",
  ).then(normalizeRecruitmentReport);

/* ============================================================
   ONBOARDING REPORT
============================================================ */

export const getOnboardingReport = (
  filters: ReportFilters = {},
): Promise<OnboardingReport> =>
  request(
    api.get<ApiResponse<OnboardingReport>>(
      "/reports/onboarding",
      {
        params: query(filters),
      },
    ),
    "Unable to load onboarding report.",
  ).then(normalizeOnboardingReport);

/* ============================================================
   PAYROLL REPORT
============================================================ */

export const getPayrollReport = (
  filters: ReportFilters = {},
): Promise<PayrollReport> =>
  request(
    api.get<ApiResponse<PayrollReport>>(
      "/reports/payroll",
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
  ).then(normalizePayrollReport);

/* ============================================================
   PERFORMANCE REPORT
============================================================ */

export const getPerformanceReport = (
  filters: ReportFilters = {},
): Promise<PerformanceReport> =>
  request(
    api.get<ApiResponse<PerformanceReport>>(
      "/reports/performance",
      {
        params: query(filters),
      },
    ),
    "Unable to load performance report.",
  ).then(normalizePerformanceReport);

/* ============================================================
   TRAINING REPORT
============================================================ */

export const getTrainingReport = (
  filters: ReportFilters = {},
): Promise<TrainingReport> =>
  request(
    api.get<ApiResponse<TrainingReport>>(
      "/reports/training",
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
  ).then(normalizeTrainingReport);

/* ============================================================
   ERROR HANDLING
============================================================ */

export const getReportsErrorMessage = (
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
      return "The selected report filters are invalid or unsupported.";
    }

    if (error.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to view these reports.";
    }

    if (error.response?.status === 404) {
      return "The requested report was not found.";
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