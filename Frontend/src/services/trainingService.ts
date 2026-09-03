import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Training Modes
|--------------------------------------------------------------------------
*/

export const trainingModes = [
  "ONLINE",
  "OFFLINE",
  "HYBRID",
] as const;

export const trainingStatuses = [
  "ACTIVE",
  "INACTIVE",
] as const;

export const enrollmentStatuses = [
  "ASSIGNED",
  "REGISTERED",
  "ATTENDED",
  "COMPLETED",
  "ASSESSMENT",
  "CERTIFICATE",
] as const;

export const assessmentResults = [
  "PASS",
  "FAIL",
] as const;

export const skillLevels = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
] as const;

export type TrainingMode =
  (typeof trainingModes)[number];

export type TrainingStatus =
  (typeof trainingStatuses)[number];

export type EnrollmentStatus =
  (typeof enrollmentStatuses)[number];

export type AssessmentResult =
  (typeof assessmentResults)[number];

export type SkillLevel =
  (typeof skillLevels)[number];

/*
|--------------------------------------------------------------------------
| Training Program
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Training Enrollment
|--------------------------------------------------------------------------
*/

export interface TrainingEnrollment {
  id: number;
  trainingProgramId: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  employeeDepartment: string | null;
  assignedDate: string | null;
  status: EnrollmentStatus | string;
  registeredDate: string | null;
  attendedDate: string | null;
  completedDate: string | null;
  assessmentScore: number | null;
  assessmentResult:
    | AssessmentResult
    | string
    | null;
  certificateName: string | null;
  certificateUrl: string | null;
  certificateDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Employee Skill
|--------------------------------------------------------------------------
*/

export interface EmployeeSkill {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  trainingEnrollmentId: number | null;
  skillName: string;
  skillLevel: SkillLevel | string;
  acquiredDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Training Program Detail
|--------------------------------------------------------------------------
*/

export interface TrainingProgramDetail
  extends TrainingProgram {
  enrollments: TrainingEnrollment[];
  skills: EmployeeSkill[];
}

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

export interface TrainingFilters {
  search?: string;
  category?: string;
  status?: string;
}

/*
|--------------------------------------------------------------------------
| Training Program Payloads
|--------------------------------------------------------------------------
*/

export interface CreateTrainingProgramPayload {
  courseName: string;
  category: string;
  trainer: string;
  duration: string;
  cost: number;
  mode: TrainingMode;
  assessment: string | null;
  description: string | null;
  status: TrainingStatus;
}

export interface UpdateTrainingProgramPayload {
  courseName: string;
  category: string;
  trainer: string;
  duration: string;
  cost: number;
  mode: TrainingMode;
  assessment: string | null;
  description: string | null;
  status: TrainingStatus;
}

/*
|--------------------------------------------------------------------------
| Training Enrollment Payloads
|--------------------------------------------------------------------------
*/

export interface CreateTrainingEnrollmentPayload {
  employeeId: number;
  assignedDate: string | null;
  remarks: string | null;
}

export interface UpdateTrainingEnrollmentPayload {
  status: EnrollmentStatus;
  registeredDate: string | null;
  attendedDate: string | null;
  completedDate: string | null;
  assessmentScore: number | null;
  assessmentResult: AssessmentResult | null;
  certificateName: string | null;
  certificateUrl: string | null;
  certificateDate: string | null;
  remarks: string | null;
}

/*
|--------------------------------------------------------------------------
| Training Skill Payloads
|--------------------------------------------------------------------------
*/

export interface CreateTrainingSkillPayload {
  employeeId: number;
  skillName: string;
  skillLevel: SkillLevel;
  acquiredDate: string | null;
  remarks: string | null;
  trainingEnrollmentId?: number | null;
}

export interface UpdateTrainingSkillPayload {
  employeeId: number;
  skillName: string;
  skillLevel: SkillLevel;
  acquiredDate: string | null;
  remarks: string | null;
  trainingEnrollmentId?: number | null;
}

/*
|--------------------------------------------------------------------------
| API Responses
|--------------------------------------------------------------------------
*/

interface TrainingListResponse {
  success: boolean;
  data: TrainingProgram[];
  total: number;
}

interface TrainingProgramResponse {
  success: boolean;
  data: TrainingProgramDetail;
}

interface TrainingEnrollmentResponse {
  success: boolean;
  data: TrainingEnrollment[];
  total: number;
}

interface TrainingSkillResponse {
  success: boolean;
  data: EmployeeSkill[];
  total: number;
}

/* =========================================================
   TRAINING PROGRAMS
========================================================= */

export const getTrainingPrograms = async (
  filters: TrainingFilters = {},
): Promise<TrainingProgram[]> => {
  const response =
    await axios.get<TrainingListResponse>(
      `${API_URL}/training`,
      {
        params: {
          search:
            filters.search ||
            undefined,

          category:
            filters.category ||
            undefined,

          status:
            filters.status ||
            undefined,
        },
      },
    );

  return response.data.data;
};

export const getTrainingProgram = async (
  id: string | number,
): Promise<TrainingProgramDetail> => {
  const response =
    await axios.get<TrainingProgramResponse>(
      `${API_URL}/training/${id}`,
    );

  return response.data.data;
};

export const createTrainingProgram = async (
  payload: CreateTrainingProgramPayload,
): Promise<TrainingProgram> => {
  const response =
    await axios.post<{
      success: boolean;
      data: TrainingProgram;
    }>(
      `${API_URL}/training`,
      payload,
    );

  return response.data.data;
};

export const updateTrainingProgram = async (
  id: string | number,
  payload: UpdateTrainingProgramPayload,
): Promise<TrainingProgram> => {
  const response =
    await axios.put<{
      success: boolean;
      data: TrainingProgram;
    }>(
      `${API_URL}/training/${id}`,
      payload,
    );

  return response.data.data;
};

export const deleteTrainingProgram = async (
  id: string | number,
): Promise<void> => {
  await axios.delete(
    `${API_URL}/training/${id}`,
  );
};

/* =========================================================
   TRAINING ENROLLMENTS
========================================================= */

export const getTrainingEnrollments = async (
  programId: string | number,
): Promise<TrainingEnrollment[]> => {
  const response =
    await axios.get<TrainingEnrollmentResponse>(
      `${API_URL}/training/${programId}/enrollments`,
    );

  return response.data.data;
};

export const createTrainingEnrollment =
  async (
    programId: string | number,
    payload: CreateTrainingEnrollmentPayload,
  ): Promise<TrainingEnrollment> => {
    const response =
      await axios.post<{
        success: boolean;
        data: TrainingEnrollment;
      }>(
        `${API_URL}/training/${programId}/enrollments`,
        payload,
      );

    return response.data.data;
  };

export const updateTrainingEnrollment =
  async (
    programId: string | number,
    enrollmentId: string | number,
    payload: UpdateTrainingEnrollmentPayload,
  ): Promise<TrainingEnrollment> => {
    const response =
      await axios.put<{
        success: boolean;
        data: TrainingEnrollment;
      }>(
        `${API_URL}/training/${programId}/enrollments/${enrollmentId}`,
        payload,
      );

    return response.data.data;
  };

export const deleteTrainingEnrollment =
  async (
    programId: string | number,
    enrollmentId: string | number,
  ): Promise<void> => {
    await axios.delete(
      `${API_URL}/training/${programId}/enrollments/${enrollmentId}`,
    );
  };

/* =========================================================
   EMPLOYEE SKILLS
========================================================= */

export const getTrainingSkills = async (
  programId: string | number,
): Promise<EmployeeSkill[]> => {
  const response =
    await axios.get<TrainingSkillResponse>(
      `${API_URL}/training/${programId}/skills`,
    );

  return response.data.data;
};

export const createTrainingSkill = async (
  programId: string | number,
  payload: CreateTrainingSkillPayload,
): Promise<EmployeeSkill> => {
  const response =
    await axios.post<{
      success: boolean;
      data: EmployeeSkill;
    }>(
      `${API_URL}/training/${programId}/skills`,
      payload,
    );

  return response.data.data;
};

export const updateTrainingSkill = async (
  programId: string | number,
  skillId: string | number,
  payload: UpdateTrainingSkillPayload,
): Promise<EmployeeSkill> => {
  const response =
    await axios.put<{
      success: boolean;
      data: EmployeeSkill;
    }>(
      `${API_URL}/training/${programId}/skills/${skillId}`,
      payload,
    );

  return response.data.data;
};

export const deleteTrainingSkill = async (
  programId: string | number,
  skillId: string | number,
): Promise<void> => {
  await axios.delete(
    `${API_URL}/training/${programId}/skills/${skillId}`,
  );
};

/* =========================================================
   ERROR HANDLING
========================================================= */

export const getTrainingErrorMessage = (
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

    if (error.message) {
      return error.message;
    }
  }

  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
};