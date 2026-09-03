import { useState } from "react";
import type { FormEvent } from "react";

import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const location = useLocation();

  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!identifier.trim()) {
      setError(
        "Please enter your username or email.",
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter your password.",
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await login({
        identifier: identifier.trim(),
        password,
      });

      const state = location.state as
        | {
            from?: {
              pathname?: string;
            };
          }
        | null;

      const destination =
        state?.from?.pathname &&
        state.from.pathname !== "/login"
          ? state.from.pathname
          : "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (loginError: unknown) {
      console.error(
        "Login failed:",
        loginError,
      );

      const axiosError = loginError as {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Invalid username/email or password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* =====================================================
            BRAND PANEL
        ===================================================== */}

        <div className="hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/20">
                HR
              </div>

              <div>
                <p className="text-lg font-bold">
                  Aakam
                </p>

                <p className="text-sm text-blue-100">
                  Human Resource Management System
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              Enterprise HR Platform
            </p>

            <h1 className="mt-5 text-5xl font-bold leading-tight">
              Manage your workforce with confidence.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-blue-100">
              A unified HR platform for workforce
              management, recruitment, onboarding,
              payroll, performance, training and
              organizational operations.
            </p>
          </div>

          <p className="text-sm text-blue-100">
            Aakam HRMS
          </p>
        </div>

        {/* =====================================================
            LOGIN PANEL
        ===================================================== */}

        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* Mobile Brand */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-bold text-white">
                HR
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  Aakam
                </p>

                <p className="text-xs text-slate-500">
                  Human Resource Management System
                </p>
              </div>
            </div>

            {/* Heading */}

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to access your Aakam HRMS
                workspace.
              </p>
            </div>

            {/* Error */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Identifier */}

              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username or Email
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(event) =>
                      setIdentifier(
                        event.target.value,
                      )
                    }
                    placeholder="Enter username or email"
                    autoComplete="username"
                    disabled={loading}
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      pl-12
                      pr-4
                      text-sm
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      pl-12
                      pr-12
                      text-sm
                      text-slate-900
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-500/10
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    disabled={loading}
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      rounded-lg
                      p-2
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                      disabled:cursor-not-allowed
                    "
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="
                  flex
                  h-12
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-600
                  to-violet-600
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:from-blue-700
                  hover:to-violet-700
                  focus:outline-none
                  focus:ring-4
                  focus:ring-blue-500/20
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Authorized users only. Your access is
              controlled by your assigned system role
              and permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;