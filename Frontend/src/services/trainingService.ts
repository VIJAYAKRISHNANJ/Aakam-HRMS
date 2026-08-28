import axios from "axios";

const API_URL = "http://localhost:5000/api/training";

export const trainingModes = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export const trainingStatuses = ["ACTIVE", "INACTIVE"] as const;
export const enrollmentStatuses = [
  "ASSIGNED",
  "REGISTERED",
  "ATTENDED",
  "COMPLETED",
  "ASSESSMENT",
  "CERTIFICATE",
] as const;
export const assessmentResults = ["PASS", "FAIL"] as const;
export const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

export type TrainingMode = (typeof trainingModes)[number];
export type TrainingStatus = (typeof trainingStatuses)[number];
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];
export type AssessmentResult = (typeof assessmentResults)[number];
export type SkillLevel = (typeof skillLevels)[number];

export interface TrainingProgram {
  id: number;
  courseName: string;
  category: string;
  trainer: string;
  duration: string;
  cost: number;
  mode: TrainingMode | string;
  assessment: string | null;
  description: string | null;
  status: TrainingStatus | string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingEnrollment {
  id: number;
  trainingProgramId: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  employeeDepartment: string;
  status: EnrollmentStatus | string;
  assignedDate: string | null;
  registeredDate: string | null;
  attendedDate: string | null;
  completedDate: string | null;
  assessmentScore: number | null;
  assessmentResult: AssessmentResult | string | null;
  certificateName: string | null;
  certificateUrl: string | null;
  certificateDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSkill {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  trainingEnrollmentId: number | null;
  skillName: string;
  skillLevel: SkillLevel | string;
  acquiredDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingProgramDetail extends TrainingProgram {
  enrollments: TrainingEnrollment[];
  skills: EmployeeSkill[];
}

export interface TrainingProgramPayload {
  courseName?: string;
  category?: string;
  trainer?: string;
  duration?: string;
  cost?: number;
  mode?: TrainingMode;
  assessment?: string | null;
  description?: string | null;
  status?: TrainingStatus;
}

export interface TrainingEnrollmentPayload {
  employeeId?: number;
  status?: EnrollmentStatus;
  assignedDate?: string | null;
  registeredDate?: string | null;
  attendedDate?: string | null;
  completedDate?: string | null;
  assessmentScore?: number | null;
  assessmentResult?: AssessmentResult | null;
  certificateName?: string | null;
  certificateUrl?: string | null;
  certificateDate?: string | null;
  remarks?: string | null;
}

export interface TrainingSkillPayload {
  employeeId?: number;
  trainingEnrollmentId?: number | null;
  skillName?: string;
  skillLevel?: SkillLevel;
  acquiredDate?: string | null;
  remarks?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const request = async <T>(promise: Promise<{ data: ApiResponse<T> }>, fallback: string): Promise<T> => {
  try {
    const response = await promise;
    if (!response.data.success) throw new Error(response.data.message || fallback);
    return response.data.data;
  } catch (error) {
    throw new Error(getTrainingErrorMessage(error, fallback), { cause: error });
  }
};

export const getTrainingPrograms = (filters: { search?: string; category?: string; status?: string } = {}): Promise<TrainingProgram[]> =>
  request(axios.get<ApiResponse<TrainingProgram[]>>(API_URL, { params: { search: filters.search || undefined, category: filters.category || undefined, status: filters.status || undefined } }), "Unable to load training programs.");

export const getTrainingProgram = (id: number | string): Promise<TrainingProgramDetail> =>
  request(axios.get<ApiResponse<TrainingProgramDetail>>(`${API_URL}/${id}`), "Unable to load this training program.");

export const createTrainingProgram = (payload: TrainingProgramPayload): Promise<TrainingProgram> =>
  request(axios.post<ApiResponse<TrainingProgram>>(API_URL, payload), "Failed to create training program.");

export const updateTrainingProgram = (id: number | string, payload: TrainingProgramPayload): Promise<TrainingProgram> =>
  request(axios.put<ApiResponse<TrainingProgram>>(`${API_URL}/${id}`, payload), "Failed to update training program.");

export const getTrainingEnrollments = (id: number | string): Promise<TrainingEnrollment[]> =>
  request(axios.get<ApiResponse<TrainingEnrollment[]>>(`${API_URL}/${id}/enrollments`), "Unable to load training enrollments.");

export const createTrainingEnrollment = (id: number | string, payload: TrainingEnrollmentPayload): Promise<TrainingEnrollment> =>
  request(axios.post<ApiResponse<TrainingEnrollment>>(`${API_URL}/${id}/enrollments`, payload), "Failed to enroll employee.");

export const updateTrainingEnrollment = (id: number | string, enrollmentId: number | string, payload: TrainingEnrollmentPayload): Promise<TrainingEnrollment> =>
  request(axios.put<ApiResponse<TrainingEnrollment>>(`${API_URL}/${id}/enrollments/${enrollmentId}`, payload), "Failed to update training enrollment.");

export const getTrainingSkills = (id: number | string): Promise<EmployeeSkill[]> =>
  request(axios.get<ApiResponse<EmployeeSkill[]>>(`${API_URL}/${id}/skills`), "Unable to load training skills.");

export const createTrainingSkill = (id: number | string, payload: TrainingSkillPayload): Promise<EmployeeSkill> =>
  request(axios.post<ApiResponse<EmployeeSkill>>(`${API_URL}/${id}/skills`, payload), "Failed to create employee skill.");

export const getTrainingErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
    if (error.response?.status === 400) return "The submitted training data is invalid.";
    if (error.response?.status === 404) return "Training program not found.";
    if (error.response?.status === 409) return "This training action conflicts with the current records.";
    if (error.response?.status === 500) return "The server could not complete this training request.";
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};