export const AUTH_TOKEN_KEY =
  "aakam_hrms_token";

export const AUTH_USER_KEY =
  "aakam_hrms_user";

export const AUTH_ROLES_KEY =
  "aakam_hrms_roles";

export const AUTH_PERMISSIONS_KEY =
  "aakam_hrms_permissions";

export const clearAuthStorage =
  (): void => {
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