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
| Date Formatting
|--------------------------------------------------------------------------
*/

const formatDate = (
  value: string,
): string => {
  if (!value) {
    return "-";
  }

  const datePart =
    value.slice(0, 10);

  const parts =
    datePart.split("-");

  if (parts.length === 3) {
    const year =
      Number(parts[0]);

    const month =
      Number(parts[1]);

    const day =
      Number(parts[2]);

    if (
      !Number.isNaN(year) &&
      !Number.isNaN(month) &&
      !Number.isNaN(day)
    ) {
      const date = new Date(
        year,
        month - 1,
        day,
      );

      if (
        !Number.isNaN(
          date.getTime(),
        )
      ) {
        return date.toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        );
      }
    }
  }

  return value;
};

/*
|--------------------------------------------------------------------------
| Value Formatting
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Employee Initials
|--------------------------------------------------------------------------
*/

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
| Info Item
|--------------------------------------------------------------------------
*/

type InfoItemProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
};

function InfoItem({
  label,
  value,
  icon,
  mono = false,
}: InfoItemProps) {
  return (
    <div className="min-w-0">

      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <div className="flex min-w-0 items-center gap-2">

        {icon && (
          <span className="shrink-0 text-slate-400">
            {icon}
          </span>
        )}

        <p
          className={`truncate text-sm font-semibold text-slate-800 ${
            mono
              ? "font-mono"
              : ""
          }`}
        >
          {value}
        </p>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Section Card
|--------------------------------------------------------------------------
*/

type SectionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

function SectionCard({
  icon,
  title,
  description,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-[0_1px_3px_rgba(15,23,42,0.04)]
        ${className}
      `}
    >

      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
          {icon}
        </div>

        <div className="min-w-0">

          <h2 className="text-sm font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-0.5 text-xs text-slate-500">
            {description}
          </p>

        </div>

      </div>

      <div className="p-5">
        {children}
      </div>

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Employee Profile
|--------------------------------------------------------------------------
*/

function EmployeeProfile() {
  const { id } =
    useParams<{ id: string }>();

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
  | Load Employee
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
            await getEmployeeById(id);

          setEmployee(data);
        } catch (
          requestError
        ) {
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

        <div className="flex min-h-[520px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

            <p className="text-sm font-medium text-slate-500">
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

  if (
    error ||
    !employee
  ) {
    return (
      <DashboardLayout>

        <div className="flex min-h-[520px] items-center justify-center px-6">

          <div className="max-w-md text-center">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <User size={21} />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Employee not found
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "The requested employee could not be found."}
            </p>

            <Link
              to="/workforce"
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-slate-900
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
              "
            >
              <ArrowLeft size={16} />
              Back to Workforce
            </Link>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Main Page
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div className="w-full min-w-0 space-y-5">

        {/* =================================================
            BACK TO EMPLOYEE DIRECTORY
        ================================================= */}

        <div>

          <Link
            to="/workforce"
            className="
              inline-flex
              w-fit
              items-center
              gap-2.5
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-900
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-400
              hover:bg-slate-50
              hover:shadow-md
            "
          >

            <ArrowLeft
              size={18}
              strokeWidth={2.2}
            />

            Back to Employee Directory

          </Link>

        </div>

        {/* =================================================
            EMPLOYEE HEADER
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Employee Identity */}

            <div className="flex min-w-0 items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-xl font-bold text-white shadow-sm">
                {getInitials(
                  employee,
                )}
              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {employee.fullName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">

                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    {formatValue(
                      employee.status,
                    )}

                  </span>

                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">

                  <span className="font-mono font-medium text-slate-600">
                    {employee.employeeCode}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span>
                    {employee.department}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span>
                    {employee.designation ||
                      "Designation not assigned"}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span>
                    {formatValue(
                      employee.employmentType,
                    )}
                  </span>

                </div>

              </div>

            </div>

            {/* =================================================
                HEADER ACTIONS
            ================================================= */}

            <div className="flex shrink-0 items-center gap-2">

              <Link
                to="/workforce"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3.5
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  transition
                  hover:border-slate-300
                  hover:bg-slate-50
                  hover:text-slate-900
                "
              >

                <ArrowLeft size={16} />

                <span className="hidden sm:inline">
                  Back
                </span>

              </Link>

              <Link
                to={`/workforce/employees/${employee.id}/edit`}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-teal-700
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-teal-800
                "
              >

                <Pencil size={15} />

                Edit Employee

              </Link>

            </div>

          </div>

        </section>

        {/* =================================================
            INFORMATION GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <SectionCard
            icon={<User size={18} />}
            title="Personal Information"
            description="Basic employee identity and contact details"
          >

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="First Name"
                value={
                  employee.firstName
                }
              />

              <InfoItem
                label="Last Name"
                value={
                  employee.lastName ||
                  "-"
                }
              />

              <InfoItem
                label="Work Email"
                value={
                  employee.email
                }
                icon={
                  <Mail size={15} />
                }
              />

              <InfoItem
                label="Employee Code"
                value={
                  employee.employeeCode
                }
                mono
              />

            </div>

          </SectionCard>

          {/* =================================================
              EMPLOYMENT
          ================================================= */}

          <SectionCard
            icon={
              <BriefcaseBusiness
                size={18}
              />
            }
            title="Employment"
            description="Current employment information"
          >

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="Designation"
                value={
                  employee.designation ||
                  "Not Assigned"
                }
              />

              <InfoItem
                label="Department"
                value={
                  employee.department
                }
              />

              <InfoItem
                label="Employment Type"
                value={formatValue(
                  employee.employmentType,
                )}
              />

              <InfoItem
                label="Joining Date"
                value={formatDate(
                  employee.joiningDate,
                )}
                icon={
                  <CalendarDays
                    size={15}
                  />
                }
              />

              <InfoItem
                label="Status"
                value={formatValue(
                  employee.status,
                )}
              />

            </div>

          </SectionCard>

          {/* =================================================
              ORGANIZATION
          ================================================= */}

          <SectionCard
            icon={<Users size={18} />}
            title="Organization"
            description="Employee organization and system access details"
          >

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="Department"
                value={
                  employee.department
                }
              />

              <InfoItem
                label="Department ID"
                value={
                  employee.departmentId
                    ?.toString() ||
                  "-"
                }
                mono
              />

              <InfoItem
                label="System Role"
                value={
                  employee.systemRole ||
                  "Not Assigned"
                }
              />

            </div>

          </SectionCard>

          {/* =================================================
              RECORD INFORMATION
          ================================================= */}

          <SectionCard
            icon={
              <CalendarDays
                size={18}
              />
            }
            title="Record Information"
            description="System record details"
          >

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="Created"
                value={formatDate(
                  employee.createdAt,
                )}
              />

              {/* IMPORTANT:
                  employee.id = database Employee ID
                  employee.employeeCode = employee code
              */}

              <InfoItem
                label="Employee ID"
                value={
                  employee.id.toString()
                }
                mono
              />

            </div>

          </SectionCard>

        </div>

        {/* =================================================
            PROFILE FOOTER
        ================================================= */}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">

          <p className="text-sm font-semibold text-slate-800">
            Employee profile
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Information is loaded directly from
            the HRMS database.
          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default EmployeeProfile;