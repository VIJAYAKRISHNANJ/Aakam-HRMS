import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  Loader2,
} from "lucide-react";

import {
  useAuth,
} from "../../context/AuthContext";

const ROLES = {
  SUPER_ADMINISTRATOR:
    "SUPER_ADMINISTRATOR",
  COMPANY_ADMINISTRATOR:
    "COMPANY_ADMINISTRATOR",
  HR_ADMINISTRATOR:
    "HR_ADMINISTRATOR",
  RECRUITER:
    "RECRUITER",
  PAYROLL_ADMINISTRATOR:
    "PAYROLL_ADMINISTRATOR",
  MANAGER:
    "MANAGER",
  EMPLOYEE:
    "EMPLOYEE",
  CLIENT_USER:
    "CLIENT_USER",
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

const normalizeRole = (
  role: string,
): string =>
  role
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

/*
|--------------------------------------------------------------------------
| Route Access Policy
|--------------------------------------------------------------------------
|
| Frontend checks are UX/access guards only.
| Backend authorization remains the final security boundary.
|
|--------------------------------------------------------------------------
*/

const routeAccess: Array<{
  matches: (pathname: string) => boolean;
  roles: Role[];
}> = [
  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Workforce
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/workforce" ||
      pathname.startsWith("/workforce/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Organization
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/organization" ||
      pathname.startsWith("/organization/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Notifications
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/notifications" ||
      pathname.startsWith("/notifications/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.RECRUITER,
      ROLES.PAYROLL_ADMINISTRATOR,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
      ROLES.CLIENT_USER,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Settings
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/settings" ||
      pathname.startsWith("/settings/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.RECRUITER,
      ROLES.PAYROLL_ADMINISTRATOR,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
      ROLES.CLIENT_USER,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Onboarding
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/onboarding" ||
      pathname.startsWith("/onboarding/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Payroll
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/payroll" ||
      pathname.startsWith("/payroll/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.PAYROLL_ADMINISTRATOR,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Performance
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/performance" ||
      pathname.startsWith("/performance/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Training
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/training" ||
      pathname.startsWith("/training/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Reports
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/reports" ||
      pathname.startsWith("/reports/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Exits
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/exits" ||
      pathname.startsWith("/exits/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Clients
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/clients" ||
      pathname.startsWith("/clients/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.RECRUITER,
      ROLES.CLIENT_USER,
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Recruitment
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/recruitment" ||
      pathname.startsWith("/recruitment/"),
    roles: [
      ROLES.SUPER_ADMINISTRATOR,
      ROLES.COMPANY_ADMINISTRATOR,
      ROLES.HR_ADMINISTRATOR,
      ROLES.RECRUITER,
      ROLES.CLIENT_USER,
    ],
  },
];

const getAllowedRolesForPath = (
  pathname: string,
): Role[] | null => {
  const policy = routeAccess.find(
    (entry) => entry.matches(pathname),
  );

  return policy?.roles ?? null;
};

function ProtectedRoute() {
  const {
    isAuthenticated,
    isLoading,
    roles,
  } = useAuth();

  const location =
    useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2
            className="h-5 w-5 animate-spin text-blue-600"
          />

          <span className="text-sm font-medium text-slate-600">
            Loading Aakam HRMS...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Role Authorization
  |--------------------------------------------------------------------------
  */

  const normalizedRoles = roles.map(
    normalizeRole,
  );

  const allowedRoles =
    getAllowedRolesForPath(
      location.pathname,
    );

  /*
  |--------------------------------------------------------------------------
  | Unknown routes
  |--------------------------------------------------------------------------
  |
  | The route itself determines whether the user can reach it.
  | If no policy exists, don't impose an additional role restriction.
  |
  |--------------------------------------------------------------------------
  */

  if (allowedRoles) {
    const hasAccess =
      allowedRoles.some(
        (allowedRole) =>
          normalizedRoles.includes(
            normalizeRole(allowedRole),
          ),
      );

    if (!hasAccess) {
      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            deniedPath: location.pathname,
          }}
        />
      );
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;