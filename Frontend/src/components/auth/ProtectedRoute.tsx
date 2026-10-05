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

/*
|--------------------------------------------------------------------------
| Route Permission Policy
|--------------------------------------------------------------------------
|
| Frontend checks are UX/access guards only.
| Backend authorization remains the final security boundary.
|
| Each module is protected by its VIEW permission.
|
| Create / Update / Delete permissions should be enforced inside the
| corresponding module pages/components and by the backend API.
|
|--------------------------------------------------------------------------
*/

type RoutePermission = {
  matches: (pathname: string) => boolean;
  permission: string;
};

const routePermissions: RoutePermission[] = [
  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  {
    matches: (pathname) =>
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/"),

    permission: "dashboard.view",
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

    permission: "workforce.view",
  },

  /*
  |--------------------------------------------------------------------------
  | Organization
  |--------------------------------------------------------------------------
  |
  | Organization uses separate permission resources.
  |
  */

  {
    matches: (pathname) =>
      pathname === "/organization/company" ||
      pathname.startsWith("/organization/company/"),

    permission: "companies.view",
  },

  {
    matches: (pathname) =>
      pathname === "/organization/branches" ||
      pathname.startsWith("/organization/branches/"),

    permission: "branches.view",
  },

  {
    matches: (pathname) =>
      pathname === "/organization/departments" ||
      pathname.startsWith("/organization/departments/"),

    permission: "departments.view",
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

    permission: "notifications.view",
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

    permission: "settings.view",
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

    permission: "onboarding.view",
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

    permission: "payroll.view",
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

    permission: "performance.view",
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

    permission: "training.view",
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

    permission: "reports.view",
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

    permission: "offboarding.view",
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

    permission: "clients.view",
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

    permission: "recruitment.view",
  },
];

/*
|--------------------------------------------------------------------------
| Find Required Permission
|--------------------------------------------------------------------------
*/

const getRequiredPermission = (
  pathname: string,
): string | null => {
  const policy = routePermissions.find(
    (entry) => entry.matches(pathname),
  );

  return policy?.permission ?? null;
};

/*
|--------------------------------------------------------------------------
| Protected Route
|--------------------------------------------------------------------------
*/

function ProtectedRoute() {
  const {
    isAuthenticated,
    isLoading,
    hasPermission,
  } = useAuth();

  const location = useLocation();

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

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
  | Permission Authorization
  |--------------------------------------------------------------------------
  */

  const requiredPermission = getRequiredPermission(
    location.pathname,
  );

  /*
  |--------------------------------------------------------------------------
  | Unknown Routes
  |--------------------------------------------------------------------------
  |
  | If there is no explicit permission policy for the route,
  | don't impose an additional frontend restriction.
  |
  |--------------------------------------------------------------------------
  */

  if (!requiredPermission) {
    return <Outlet />;
  }

  /*
  |--------------------------------------------------------------------------
  | Permission Check
  |--------------------------------------------------------------------------
  */

  const hasAccess = hasPermission(
    requiredPermission,
  );

  /*
  |--------------------------------------------------------------------------
  | Unauthorized Route
  |--------------------------------------------------------------------------
  */

  if (!hasAccess) {
    /*
    |--------------------------------------------------------------------------
    | Preferred fallback
    |--------------------------------------------------------------------------
    |
    | Settings is used when the authenticated user has access to it.
    | Otherwise Dashboard is used when available.
    |
    */

    const fallbackPath = hasPermission("settings.view")
      ? "/settings"
      : hasPermission("dashboard.view")
        ? "/dashboard"
        : "/login";

    /*
    |--------------------------------------------------------------------------
    | Safety Guard
    |--------------------------------------------------------------------------
    |
    | Never redirect to the exact same pathname.
    |
    */

    if (location.pathname === fallbackPath) {
      return <Outlet />;
    }

    /*
    |--------------------------------------------------------------------------
    | No accessible fallback
    |--------------------------------------------------------------------------
    */

    if (fallbackPath === "/login") {
      return (
        <Navigate
          to="/login"
          replace
          state={{
            deniedPath: location.pathname,
          }}
        />
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Redirect Unauthorized User
    |--------------------------------------------------------------------------
    */

    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          deniedPath: location.pathname,
        }}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Authorized
  |--------------------------------------------------------------------------
  */

  return <Outlet />;
}

export default ProtectedRoute;