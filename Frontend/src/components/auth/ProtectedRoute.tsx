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

function ProtectedRoute() {
  const {
    isAuthenticated,
    isLoading,
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

  return <Outlet />;
}

export default ProtectedRoute;