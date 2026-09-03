import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Job Status
|--------------------------------------------------------------------------
*/

export type JobStatus = "OPEN" | "CLOSED";

export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "SELECTED"
  | "HIRED"
  | "REJECTED";

/*
|--------------------------------------------------------------------------
| Job Position
|--------------------------------------------------------------------------
*/

export interface JobPosition {
  id: number;
  title: string;
  departmentId: number | null;
  department: string;
  openings: number;
  status: JobStatus;
  createdAt: string;
  candidateCount: number;
}

/*
|--------------------------------------------------------------------------
| Candidate
|--------------------------------------------------------------------------
*/

export interface Candidate {
  id: number;
  name: string;
  email: string;
  jobPositionId: number | null;
  jobPosition: string;
  department: string;
  stage: CandidateStage | string;
  createdAt: string;
  appliedAt: string;
}

/*
|--------------------------------------------------------------------------
| Recruitment Stats
|--------------------------------------------------------------------------
*/

export interface RecruitmentStats {
  totalJobPositions: number;
  openPositions: number;
  totalCandidates: number;
  inInterview: number;
  selected: number;
  hired: number;
  pipeline: Record<CandidateStage, number>;
}

/*
|--------------------------------------------------------------------------
| Payloads
|--------------------------------------------------------------------------
*/

export interface JobPositionPayload {
  title: string;
  departmentId: number | null;
  openings: number;
  status: JobStatus;
}

export interface CandidatePayload {
  name: string;
  email: string;
  jobPositionId: number;
  stage: CandidateStage;
}

/*
|--------------------------------------------------------------------------
| Candidate Stage Helper
|--------------------------------------------------------------------------
*/

export function isCandidateStage(
  value: string,
): value is CandidateStage {
  return [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "SELECTED",
    "HIRED",
    "REJECTED",
  ].includes(value);
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

interface ApiErrorResponse {
  message?: string;
}

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

export function getRecruitmentErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.message ??
      fallback
    );
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

export interface JobPositionFilters {
  search?: string;
  status?: JobStatus | "";
}

export interface CandidateFilters {
  search?: string;
  stage?: CandidateStage | "";
  jobPositionId?: number | string;
}

/*
|--------------------------------------------------------------------------
| Job Positions
|--------------------------------------------------------------------------
*/

/*
| GET /api/recruitment/jobs
*/

export const getJobPositions = async (
  filters: JobPositionFilters = {},
): Promise<JobPosition[]> => {
  const response =
    await axios.get<ApiResponse<JobPosition[]>>(
      `${API_URL}/recruitment/jobs`,
      {
        params: {
          search:
            filters.search ||
            undefined,

          status:
            filters.status ||
            undefined,
        },
      },
    );

  return response.data.data;
};

/*
| GET /api/recruitment/jobs/:id
*/

export const getJobPositionById = async (
  id: number | string,
): Promise<JobPosition> => {
  const response =
    await axios.get<ApiResponse<JobPosition>>(
      `${API_URL}/recruitment/jobs/${id}`,
    );

  return response.data.data;
};

/*
| POST /api/recruitment/jobs
*/

export const createJobPosition = async (
  payload: JobPositionPayload,
): Promise<JobPosition> => {
  const response =
    await axios.post<ApiResponse<JobPosition>>(
      `${API_URL}/recruitment/jobs`,
      payload,
    );

  return response.data.data;
};

/*
| PUT /api/recruitment/jobs/:id
*/

export const updateJobPosition = async (
  id: number | string,
  payload: JobPositionPayload,
): Promise<JobPosition> => {
  const response =
    await axios.put<ApiResponse<JobPosition>>(
      `${API_URL}/recruitment/jobs/${id}`,
      payload,
    );

  return response.data.data;
};

/*
| DELETE /api/recruitment/jobs/:id
*/

export const deleteJobPosition = async (
  id: number | string,
): Promise<void> => {
  await axios.delete(
    `${API_URL}/recruitment/jobs/${id}`,
  );
};

/*
|--------------------------------------------------------------------------
| Candidates
|--------------------------------------------------------------------------
*/

/*
| GET /api/recruitment/candidates
*/

export const getCandidates = async (
  filters: CandidateFilters = {},
): Promise<Candidate[]> => {
  const response =
    await axios.get<ApiResponse<Candidate[]>>(
      `${API_URL}/recruitment/candidates`,
      {
        params: {
          search:
            filters.search ||
            undefined,

          stage:
            filters.stage ||
            undefined,

          jobPositionId:
            filters.jobPositionId ||
            undefined,
        },
      },
    );

  return response.data.data;
};

/*
| GET /api/recruitment/candidates/:id
*/

export const getCandidateById = async (
  id: number | string,
): Promise<Candidate> => {
  const response =
    await axios.get<ApiResponse<Candidate>>(
      `${API_URL}/recruitment/candidates/${id}`,
    );

  return response.data.data;
};

/*
| POST /api/recruitment/candidates
*/

export const createCandidate = async (
  payload: CandidatePayload,
): Promise<Candidate> => {
  const response =
    await axios.post<ApiResponse<Candidate>>(
      `${API_URL}/recruitment/candidates`,
      payload,
    );

  return response.data.data;
};

/*
| PUT /api/recruitment/candidates/:id
*/

export const updateCandidate = async (
  id: number | string,
  payload: CandidatePayload,
): Promise<Candidate> => {
  const response =
    await axios.put<ApiResponse<Candidate>>(
      `${API_URL}/recruitment/candidates/${id}`,
      payload,
    );

  return response.data.data;
};

/*
| DELETE /api/recruitment/candidates/:id
*/

export const deleteCandidate = async (
  id: number | string,
): Promise<void> => {
  await axios.delete(
    `${API_URL}/recruitment/candidates/${id}`,
  );
};

/*
| PUT /api/recruitment/candidates/:id/stage
*/

export const updateCandidateStage = async (
  id: number | string,
  stage: CandidateStage,
): Promise<Candidate> => {
  const response =
    await axios.put<ApiResponse<Candidate>>(
      `${API_URL}/recruitment/candidates/${id}/stage`,
      { stage },
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Recruitment Stats
|--------------------------------------------------------------------------
*/

/*
| GET /api/recruitment/stats
*/

export const getRecruitmentStats =
  async (): Promise<RecruitmentStats> => {
    const response =
      await axios.get<
        ApiResponse<RecruitmentStats>
      >(
        `${API_URL}/recruitment/stats`,
      );

    return response.data.data;
  };