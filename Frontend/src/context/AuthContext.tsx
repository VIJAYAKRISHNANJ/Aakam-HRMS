import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  getCurrentUser,
  getStoredPermissions,
  getStoredRoles,
  getStoredToken,
  getStoredUser,
  login as loginRequest,
  logout as logoutRequest,
  saveAuthData,
} from "../services/authService";

import type {
  AuthUser,
  LoginPayload,
} from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];

  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    payload: LoginPayload,
  ) => Promise<void>;

  logout: () => Promise<void>;

  hasRole: (
    role: string,
  ) => boolean;

  hasAnyRole: (
    roles: string[],
  ) => boolean;

  hasPermission: (
    permission: string,
  ) => boolean;

  hasAnyPermission: (
    permissions: string[],
  ) => boolean;

  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    getStoredUser(),
  );

  const [
    roles,
    setRoles,
  ] = useState<string[]>(
    getStoredRoles(),
  );

  const [
    permissions,
    setPermissions,
  ] = useState<string[]>(
    getStoredPermissions(),
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState<boolean>(
    true,
  );

  const refreshUser =
    useCallback(
      async () => {
        const token =
          getStoredToken();

        if (!token) {
          setUser(null);
          setRoles([]);
          setPermissions([]);
          setIsLoading(false);

          return;
        }

        try {
          const response =
            await getCurrentUser();

          setUser(
            response.data.user,
          );

          setRoles(
            response.data.roles,
          );

          setPermissions(
            response.data.permissions,
          );

          localStorage.setItem(
            "aakam_hrms_user",
            JSON.stringify(
              response.data.user,
            ),
          );

          localStorage.setItem(
            "aakam_hrms_roles",
            JSON.stringify(
              response.data.roles,
            ),
          );

          localStorage.setItem(
            "aakam_hrms_permissions",
            JSON.stringify(
              response.data.permissions,
            ),
          );
        } catch (error) {
          console.error(
            "Authentication validation failed:",
            error,
          );

          localStorage.removeItem(
            "aakam_hrms_token",
          );

          localStorage.removeItem(
            "aakam_hrms_user",
          );

          localStorage.removeItem(
            "aakam_hrms_roles",
          );

          localStorage.removeItem(
            "aakam_hrms_permissions",
          );

          setUser(null);
          setRoles([]);
          setPermissions([]);
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login =
    useCallback(
      async (
        payload: LoginPayload,
      ) => {
        const response =
          await loginRequest(
            payload,
          );

        if (
          !response.success ||
          !response.data?.token ||
          !response.data?.user
        ) {
          throw new Error(
            response.message ||
              "Login failed.",
          );
        }

        saveAuthData(
          response,
        );

        setUser(
          response.data.user,
        );

        setRoles(
          response.data.roles || [],
        );

        setPermissions(
          response.data.permissions ||
            [],
        );
      },
      [],
    );

  const logout =
    useCallback(
      async () => {
        await logoutRequest();

        setUser(null);
        setRoles([]);
        setPermissions([]);
      },
      [],
    );

  const hasRole =
    useCallback(
      (
        role: string,
      ) => {
        return roles.some(
          (currentRole) =>
            currentRole.toUpperCase() ===
            role.toUpperCase(),
        );
      },
      [roles],
    );

  const hasAnyRole =
    useCallback(
      (
        requiredRoles: string[],
      ) => {
        return requiredRoles.some(
          (role) =>
            roles.some(
              (currentRole) =>
                currentRole.toUpperCase() ===
                role.toUpperCase(),
            ),
        );
      },
      [roles],
    );

  const hasPermission =
    useCallback(
      (
        permission: string,
      ) => {
        return permissions.some(
          (currentPermission) =>
            currentPermission.toLowerCase() ===
            permission.toLowerCase(),
        );
      },
      [permissions],
    );

  const hasAnyPermission =
    useCallback(
      (
        requiredPermissions: string[],
      ) => {
        return requiredPermissions.some(
          (permission) =>
            permissions.some(
              (currentPermission) =>
                currentPermission.toLowerCase() ===
                permission.toLowerCase(),
            ),
        );
      },
      [permissions],
    );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        roles,
        permissions,

        isAuthenticated:
          Boolean(user),

        isLoading,

        login,
        logout,

        hasRole,
        hasAnyRole,

        hasPermission,
        hasAnyPermission,

        refreshUser,
      }),
      [
        user,
        roles,
        permissions,
        isLoading,
        login,
        logout,
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAnyPermission,
        refreshUser,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(
      AuthContext,
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}

export default AuthContext;