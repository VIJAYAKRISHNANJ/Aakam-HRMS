import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string | null;
  fullName: string;

  employeeId: number | null;
  employeeCode: string | null;
  employeeStatus: string | null;

  designation: string | null;

  departmentId: number | null;
  department: string | null;

  isActive: boolean;

  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;

  passwordChangedAt: string | null;
  passwordExpiresAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    tokenType: string;
    expiresIn: string;
    user: AuthUser;
    roles: string[];
    permissions: string[];
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: AuthUser;
    roles: string[];
    permissions: string[];
  };
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export const AUTH_TOKEN_KEY = "aakam_hrms_token";
export const AUTH_USER_KEY = "aakam_hrms_user";
export const AUTH_ROLES_KEY = "aakam_hrms_roles";
export const AUTH_PERMISSIONS_KEY = "aakam_hrms_permissions";

export const login = async (
  payload: LoginPayload,
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/login`,
    payload,
  );

  return response.data;
};

export const getCurrentUser = async (): Promise<MeResponse> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await axios.get<MeResponse>(
    `${API_BASE_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

export const logout = async (): Promise<void> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error(
        "Logout API request failed:",
        error,
      );
    }
  }

  clearAuthStorage();
};

export const saveAuthData = (
  response: LoginResponse,
): void => {
  const {
    token,
    user,
    roles,
    permissions,
  } = response.data;

  localStorage.setItem(
    AUTH_TOKEN_KEY,
    token,
  );

  localStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(user),
  );

  localStorage.setItem(
    AUTH_ROLES_KEY,
    JSON.stringify(roles),
  );

  localStorage.setItem(
    AUTH_PERMISSIONS_KEY,
    JSON.stringify(permissions),
  );
};

export const clearAuthStorage = (): void => {
  localStorage.removeItem(
    AUTH_TOKEN_KEY,
  );

  localStorage.removeItem(
    AUTH_USER_KEY,
  );

  localStorage.removeItem(
    AUTH_ROLES_KEY,
  );

  localStorage.removeItem(
    AUTH_PERMISSIONS_KEY,
  );
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem(
    AUTH_TOKEN_KEY,
  );
};

export const getStoredUser = (): AuthUser | null => {
  const storedUser =
    localStorage.getItem(
      AUTH_USER_KEY,
    );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser,
    ) as AuthUser;
  } catch {
    clearAuthStorage();

    return null;
  }
};

export const getStoredRoles = (): string[] => {
  const storedRoles =
    localStorage.getItem(
      AUTH_ROLES_KEY,
    );

  if (!storedRoles) {
    return [];
  }

  try {
    return JSON.parse(
      storedRoles,
    ) as string[];
  } catch {
    return [];
  }
};

export const getStoredPermissions = (): string[] => {
  const storedPermissions =
    localStorage.getItem(
      AUTH_PERMISSIONS_KEY,
    );

  if (!storedPermissions) {
    return [];
  }

  try {
    return JSON.parse(
      storedPermissions,
    ) as string[];
  } catch {
    return [];
  }
};