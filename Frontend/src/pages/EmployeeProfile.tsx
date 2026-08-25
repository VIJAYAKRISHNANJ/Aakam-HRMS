import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  Pencil,
  User,
  Users,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  getEmployeeById,
  type Employee,
} from "../services/workforceService";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatDate = (
  value: string,
): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

const formatValue = (
  value: string,
): string => {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
};

const getInitials = (
  employee: Employee,
): string => {
  const first =
    employee.firstName
      ?.charAt(0)
      ?.toUpperCase() ?? "";

  const last =
    employee.lastName
      ?.charAt(0)
      ?.toUpperCase() ?? "";

  return `${first}${last}`;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function EmployeeProfile() {
  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    employee,
    setEmployee,
  ] = useState<Employee | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load employee
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadEmployee =
      async () => {
        if (!id) {
          setError(
            "Employee ID is missing.",
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);

          setError("");

          const data =
            await getEmployeeById(
              id,
            );

          setEmployee(data);
        } catch (requestError) {
          console.error(
            "Failed to load employee profile:",
            requestError,
          );

          setError(
            "Unable to load employee profile.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadEmployee();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

            <p className="text-sm text-slate-500">
              Loading employee profile...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <User size={20} />
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              Employee not found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {error ||
                "The requested employee could not be found."}
            </p>

            <Link
              to="/workforce"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <ArrowLeft
                size={16}
              />

              Back to Workforce
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Profile
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        {/* =================================================
            BACK
        ================================================= */}

        <Link
          to="/workforce"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700"
        >
          <ArrowLeft
            size={17}
          />

          Back to Employee
          Directory
        </Link>

        {/* =================================================
            PROFILE HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">
          <div className="h-28 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-teal-600 to-cyan-500 text-2xl font-bold text-white shadow-md">
                  {getInitials(
                    employee,
                  )}
                </div>

                <div className="pb-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {
                      employee.fullName
                    }
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      employee.employeeCode
                    }
                    {" • "}
                    {
                      employee.department
                    }
                  </p>
                </div>
              </div>

              <div className="flex w-fit items-center gap-3">
                <span className="inline-flex w-fit items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {formatValue(
                    employee.status,
                  )}
                </span>

                <Link
                  to={`/workforce/employees/${employee.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            PROFILE CONTENT
        ================================================= */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <section className="rounded-xl border border-slate-300 bg-white xl:col-span-2">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <User
                    size={18}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Basic employee details
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  First Name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {
                    employee.firstName
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Name
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {
                    employee.lastName ||
                    "-"
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <Mail
                    size={15}
                    className="text-slate-400"
                  />

                  <p className="text-sm font-medium text-slate-800">
                    {
                      employee.email
                    }
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Employee ID
                </p>

                <p className="mt-1 font-mono text-sm font-medium text-slate-800">
                  {
                    employee.employeeCode
                  }
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              EMPLOYMENT SUMMARY
          ================================================= */}

          <section className="rounded-xl border border-slate-300 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <BriefcaseBusiness
                    size={18}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Employment
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Current employment details
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Department
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {
                    employee.department
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Employment Type
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatValue(
                    employee.employmentType,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Joining Date
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-slate-400"
                  />

                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(
                      employee.joiningDate,
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatValue(
                    employee.status,
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              ORGANIZATION
          ================================================= */}

          <section className="rounded-xl border border-slate-300 bg-white xl:col-span-2">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Users
                    size={18}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Organization
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Employee organization details
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Department
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {
                    employee.department
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Department ID
                </p>

                <p className="mt-1 font-mono text-sm font-medium text-slate-800">
                  {employee.departmentId ??
                    "-"}
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              RECORD INFORMATION
          ================================================= */}

          <section className="rounded-xl border border-slate-300 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <CalendarDays
                    size={18}
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Record
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    System information
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {formatDate(
                    employee.createdAt,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Employee ID
                </p>

                <p className="mt-1 font-mono text-sm font-medium text-slate-800">
                  {
                    employee.employeeCode
                  }
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EmployeeProfile;
