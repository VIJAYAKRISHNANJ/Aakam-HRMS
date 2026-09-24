import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  saveAuthData,
  getStoredToken,
  getStoredUser,
  getStoredRoles,
  getStoredPermissions,
  type AuthUser,
  type LoginPayload,
  type LoginResponse,
} from "../services/authService";

import { clearAuthStorage } from "../services/authStorage";

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "../utils/permissions";

interface AuthContextValue {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (
    payload: LoginPayload,
  ) => Promise<LoginResponse>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

  hasRole: (
    role: string,
  ) => boolean;

  hasAnyRole: (
    requiredRoles: string[],
  ) => boolean;

  hasPermission: (
    permission: string,
  ) => boolean;

  hasAnyPermission: (
    requiredPermissions: string[],
  ) => boolean;

  hasAllPermissions: (
    requiredPermissions: string[],
  ) => boolean;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function normalizeRole(
  role: unknown,
): string {
  return String(role ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeRoles(
  roles: readonly unknown[],
): string[] {
  return roles
    .map(normalizeRole)
    .filter(Boolean);
}

function normalizePermissions(
  permissions: readonly unknown[],
): string[] {
  return permissions
    .map((permission) =>
      String(permission ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

function isSuperAdministrator(
  roles: readonly string[],
): boolean {
  return roles.some(
    (role) =>
      normalizeRole(role) ===
      "SUPER_ADMINISTRATOR",
  );
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(
      getStoredUser(),
    );

  const [roles, setRoles] =
    useState<string[]>(
      normalizeRoles(
        getStoredRoles(),
      ),
    );

  const [permissions, setPermissions] =
    useState<string[]>(
      normalizePermissions(
        getStoredPermissions(),
      ),
    );

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const clearAuthenticationState =
    useCallback(() => {
      clearAuthStorage();

      setUser(null);
      setRoles([]);
      setPermissions([]);
    }, []);

  const refreshUser =
    useCallback(async () => {
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

        const nextUser =
          response.data.user;

        const nextRoles =
          normalizeRoles(
            response.data.roles,
          );

        const nextPermissions =
          normalizePermissions(
            response.data.permissions,
          );

        setUser(nextUser);
        setRoles(nextRoles);
        setPermissions(
          nextPermissions,
        );

        localStorage.setItem(
          "aakam_hrms_user",
          JSON.stringify(
            nextUser,
          ),
        );

        localStorage.setItem(
          "aakam_hrms_roles",
          JSON.stringify(
            nextRoles,
          ),
        );

        localStorage.setItem(
          "aakam_hrms_permissions",
          JSON.stringify(
            nextPermissions,
          ),
        );
      } catch (error) {
        console.error(
          "Unable to refresh authenticated user:",
          error,
        );

        clearAuthenticationState();
      } finally {
        setIsLoading(false);
      }
    }, [
      clearAuthenticationState,
    ]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login =
    useCallback(
      async (
        payload: LoginPayload,
      ): Promise<LoginResponse> => {
        setIsLoading(true);

        try {
          const response =
            await loginRequest(
              payload,
            );

          const nextUser =
            response.data.user;

          const nextRoles =
            normalizeRoles(
              response.data.roles,
            );

          const nextPermissions =
            normalizePermissions(
              response.data.permissions,
            );

          saveAuthData(response);

          setUser(nextUser);

          setRoles(nextRoles);

          setPermissions(
            nextPermissions,
          );

          return response;
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  const logout =
    useCallback(async () => {
      try {
        await logoutRequest();
      } catch (error) {
        console.error(
          "Logout request failed:",
          error,
        );
      } finally {
        clearAuthenticationState();
      }
    }, [
      clearAuthenticationState,
    ]);

  const hasRole =
    useCallback(
      (
        role: string,
      ): boolean => {
        const normalizedRole =
          normalizeRole(role);

        if (!normalizedRole) {
          return false;
        }

        return roles.some(
          (userRole) =>
            normalizeRole(
              userRole,
            ) === normalizedRole,
        );
      },
      [roles],
    );

  const hasAnyRole =
    useCallback(
      (
        requiredRoles: string[],
      ): boolean => {
        if (
          requiredRoles.length === 0
        ) {
          return false;
        }

        const normalizedRequiredRoles =
          requiredRoles.map(
            normalizeRole,
          );

        return roles.some(
          (userRole) =>
            normalizedRequiredRoles.includes(
              normalizeRole(
                userRole,
              ),
            ),
        );
      },
      [roles],
    );

  /*
   * SUPER_ADMINISTRATOR has unrestricted
   * frontend access.
   *
   * This is intentionally role-based rather
   * than permission-string-based so the admin
   * is not affected by legacy/new permission
   * naming differences between modules.
   */

  const can =
    useCallback(
      (
        permission: string,
      ): boolean => {
        if (
          isSuperAdministrator(
            roles,
          )
        ) {
          return true;
        }

        return hasPermission(
          permissions,
          permission,
        );
      },
      [permissions, roles],
    );

  const canAny =
    useCallback(
      (
        requiredPermissions: string[],
      ): boolean => {
        if (
          isSuperAdministrator(
            roles,
          )
        ) {
          return true;
        }

        return hasAnyPermission(
          permissions,
          requiredPermissions,
        );
      },
      [permissions, roles],
    );

  const canAll =
    useCallback(
      (
        requiredPermissions: string[],
      ): boolean => {
        if (
          isSuperAdministrator(
            roles,
          )
        ) {
          return true;
        }

        return hasAllPermissions(
          permissions,
          requiredPermissions,
        );
      },
      [permissions, roles],
    );

  const contextValue =
    useMemo<AuthContextValue>(
      () => ({
        user,

        roles,

        permissions,

        isAuthenticated:
          Boolean(
            user &&
              getStoredToken(),
          ),

        isLoading,

        login,

        logout,

        refreshUser,

        hasRole,

        hasAnyRole,

        hasPermission: can,

        hasAnyPermission: canAny,

        hasAllPermissions: canAll,
      }),
      [
        user,
        roles,
        permissions,
        isLoading,
        login,
        logout,
        refreshUser,
        hasRole,
        hasAnyRole,
        can,
        canAny,
        canAll,
      ],
    );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider.",
    );
  }

  return context;
}

export default AuthContext;