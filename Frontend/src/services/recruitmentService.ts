import axios from "axios";

const API_URL = "http://localhost:5000/api/recruitment";

export type JobStatus = "OPEN" | "CLOSED";
export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "SELECTED"
  | "HIRED"
  | "REJECTED";

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

export interface RecruitmentStats {
  totalJobPositions: number;
  openPositions: number;
  totalCandidates: number;
  inInterview: number;
  selected: number;
  hired: number;
  pipeline: Record<CandidateStage, number>;
}

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

export function isCandidateStage(value: string): value is CandidateStage {
  return [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "SELECTED",
    "HIRED",
    "REJECTED",
  ].includes(value);
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  message?: string;
}

export function getRecruitmentErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export interface JobPositionFilters {
  search?: string;
  status?: JobStatus | "";
}

export interface CandidateFilters {
  search?: string;
  stage?: CandidateStage | "";
  jobPositionId?: number | string;
}

export const getJobPositions = async (
  filters: JobPositionFilters = {},
): Promise<JobPosition[]> => {
  const response = await axios.get<ApiResponse<JobPosition[]>>(
    `${API_URL}/jobs`,
    {
      params: {
        search: filters.search || undefined,
        status: filters.status || undefined,
      },
    },
  );
  return response.data.data;
};

export const getJobPositionById = async (
  id: number | string,
): Promise<JobPosition> => {
  const response = await axios.get<ApiResponse<JobPosition>>(
    `${API_URL}/jobs/${id}`,
  );
  return response.data.data;
};

export const createJobPosition = async (
  payload: JobPositionPayload,
): Promise<JobPosition> => {
  const response = await axios.post<ApiResponse<JobPosition>>(
    `${API_URL}/jobs`,
    payload,
  );
  return response.data.data;
};

export const updateJobPosition = async (
  id: number | string,
  payload: JobPositionPayload,
): Promise<JobPosition> => {
  const response = await axios.put<ApiResponse<JobPosition>>(
    `${API_URL}/jobs/${id}`,
    payload,
  );
  return response.data.data;
};

export const deleteJobPosition = async (id: number | string): Promise<void> => {
  await axios.delete(`${API_URL}/jobs/${id}`);
};

export const getCandidates = async (
  filters: CandidateFilters = {},
): Promise<Candidate[]> => {
  const response = await axios.get<ApiResponse<Candidate[]>>(
    `${API_URL}/candidates`,
    {
      params: {
        search: filters.search || undefined,
        stage: filters.stage || undefined,
        jobPositionId: filters.jobPositionId || undefined,
      },
    },
  );
  return response.data.data;
};

export const getCandidateById = async (
  id: number | string,
): Promise<Candidate> => {
  const response = await axios.get<ApiResponse<Candidate>>(
    `${API_URL}/candidates/${id}`,
  );
  return response.data.data;
};

export const createCandidate = async (
  payload: CandidatePayload,
): Promise<Candidate> => {
  const response = await axios.post<ApiResponse<Candidate>>(
    `${API_URL}/candidates`,
    payload,
  );
  return response.data.data;
};

export const updateCandidate = async (
  id: number | string,
  payload: CandidatePayload,
): Promise<Candidate> => {
  const response = await axios.put<ApiResponse<Candidate>>(
    `${API_URL}/candidates/${id}`,
    payload,
  );
  return response.data.data;
};

export const deleteCandidate = async (id: number | string): Promise<void> => {
  await axios.delete(`${API_URL}/candidates/${id}`);
};

export const updateCandidateStage = async (
  id: number | string,
  stage: CandidateStage,
): Promise<Candidate> => {
  const response = await axios.put<ApiResponse<Candidate>>(
    `${API_URL}/candidates/${id}/stage`,
    { stage },
  );
  return response.data.data;
};

export const getRecruitmentStats = async (): Promise<RecruitmentStats> => {
  const response = await axios.get<ApiResponse<RecruitmentStats>>(
    `${API_URL}/stats`,
  );
  return response.data.data;
};
