import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

export interface DashboardSummary {
  totalEmployees: number;
  newJoiners: number;
  openPositions: number;
  pendingLeave: number;
}

interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
}

export const getDashboardSummary =
  async (): Promise<DashboardSummary> => {
    const response =
      await axios.get<DashboardSummaryResponse>(
        `${API_URL}/dashboard/summary`,
      );

    return response.data.data;
  };

/* =========================================================
   HEADCOUNT
========================================================= */

export interface HeadcountPoint {
  month: string;
  total: number;
}

interface HeadcountResponse {
  success: boolean;
  data: HeadcountPoint[];
}

export const getHeadcountData =
  async (): Promise<HeadcountPoint[]> => {
    const response =
      await axios.get<HeadcountResponse>(
        `${API_URL}/dashboard/headcount`,
      );

    return response.data.data;
  };

/* =========================================================
   DEPARTMENTS
========================================================= */

export interface DepartmentPoint {
  id: number;
  name: string;
  value: number;
}

interface DepartmentResponse {
  success: boolean;
  data: DepartmentPoint[];
}

export const getDepartmentData =
  async (): Promise<DepartmentPoint[]> => {
    const response =
      await axios.get<DepartmentResponse>(
        `${API_URL}/dashboard/departments`,
      );

    return response.data.data;
  };

/* =========================================================
   ATTENDANCE
========================================================= */

export interface AttendanceData {
  date: string | null;
  attendanceRate: number;
  total: number;
  present: number;
  absent: number;
  onTime: number;
  late: number;
}

interface AttendanceResponse {
  success: boolean;
  data: AttendanceData;
}

export const getAttendanceData =
  async (): Promise<AttendanceData> => {
    const response =
      await axios.get<AttendanceResponse>(
        `${API_URL}/dashboard/attendance`,
      );

    return response.data.data;
  };

/* =========================================================
   RECENT ACTIVITY
========================================================= */

export interface ActivityPoint {
  activityType: string;
  title: string;
  description: string;
  activityTime: string;
}

interface ActivityResponse {
  success: boolean;
  data: ActivityPoint[];
}

export const getActivityData =
  async (): Promise<ActivityPoint[]> => {
    const response =
      await axios.get<ActivityResponse>(
        `${API_URL}/dashboard/activity`,
      );

    return response.data.data;
  };

/* =========================================================
   QUICK INSIGHTS + UPCOMING ACTIONS
========================================================= */

export interface InsightPoint {
  title: string;
  value: string;
  detail: string;
}

export interface ActionPoint {
  title: string;
  count: number;
  description: string;
}

export interface DashboardInsights {
  insights: InsightPoint[];
  actions: ActionPoint[];
}

interface InsightsResponse {
  success: boolean;
  data: DashboardInsights;
}

export const getDashboardInsights =
  async (): Promise<DashboardInsights> => {
    const response =
      await axios.get<InsightsResponse>(
        `${API_URL}/dashboard/insights`,
      );

    return response.data.data;
  };