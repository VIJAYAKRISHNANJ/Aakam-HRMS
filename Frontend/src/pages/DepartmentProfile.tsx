import {
  ArrowLeft,
  CalendarDays,
  Layers3,
  Pencil,
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
  getDepartmentById,
  type Department,
} from "../services/departmentService";

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

const getInitials = (
  department: Department,
): string => {
  const first =
    department.name
      ?.charAt(0)
      ?.toUpperCase() ?? "";

  const second =
    department.name
      ?.split(" ")
      .filter(Boolean)
      .at(1)
      ?.charAt(0)
      ?.toUpperCase() ?? "";

  return `${first}${second}`;
};

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

type SectionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

function SectionCard({
  icon,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

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

function DepartmentProfile() {
  const { id } =
    useParams<{ id: string }>();

  const [
    department,
    setDepartment,
  ] = useState<Department | null>(
    null,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadDepartment =
      async () => {
        if (!id) {
          setError(
            "Department ID is missing.",
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const data =
            await getDepartmentById(id);

          setDepartment(data);
        } catch (requestError) {
          console.error(
            "Failed to load department profile:",
            requestError,
          );

          setError(
            "Unable to load department profile.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadDepartment();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>

        <div className="flex min-h-[520px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

            <p className="text-sm font-medium text-slate-500">
              Loading department profile...
            </p>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  if (error || !department) {
    return (
      <DashboardLayout>

        <div className="flex min-h-[520px] items-center justify-center px-6">

          <div className="max-w-md text-center">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Layers3 size={21} />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Department not found
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "The requested department could not be found."}
            </p>

            <Link
              to="/organization/departments"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to Departments
            </Link>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="w-full min-w-0 space-y-5">

        {/* Back */}

        <div>

          <Link
            to="/organization/departments"
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              hover:text-slate-900
              focus:outline-none
              focus:ring-2
              focus:ring-teal-600/20
            "
          >
            <ArrowLeft size={16} />
            Departments
          </Link>

        </div>

        {/* Department Header */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex min-w-0 items-center gap-4">

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-xl font-bold text-white shadow-sm">
                {getInitials(department)}
              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {department.name}
                  </h1>

                  <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-inset ring-teal-100">
                    Department
                  </span>

                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">

                  <span className="font-mono font-medium text-slate-600">
                    {department.code}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span>
                    {department.employeeCount}{" "}
                    {department.employeeCount ===
                    1
                      ? "employee"
                      : "employees"}
                  </span>

                </div>

              </div>

            </div>

            <div className="flex shrink-0 items-center gap-2">

              <Link
                to="/organization/departments"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeft size={16} />

                <span className="hidden sm:inline">
                  Back
                </span>
              </Link>

              <Link
                to={`/organization/departments/edit/${department.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <Pencil size={15} />
                Edit Department
              </Link>

            </div>

          </div>

        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          <SectionCard
            icon={<Layers3 size={18} />}
            title="Department Information"
            description="Basic department details"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="Department Name"
                value={department.name}
              />

              <InfoItem
                label="Department Code"
                value={department.code}
                mono
              />

              <InfoItem
                label="Department ID"
                value={String(department.id)}
                mono
              />

            </div>
          </SectionCard>

          <SectionCard
            icon={<Users size={18} />}
            title="Workforce"
            description="Employees currently assigned to this department"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="Employees"
                value={`${department.employeeCount}`}
                icon={<Users size={15} />}
              />

              <InfoItem
                label="Team Status"
                value={
                  department.employeeCount > 0
                    ? "Active Workforce"
                    : "No Employees"
                }
              />

            </div>
          </SectionCard>

          <SectionCard
            icon={<CalendarDays size={18} />}
            title="Record Information"
            description="System record details"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">

              <InfoItem
                label="Created"
                value={formatDate(
                  department.createdAt,
                )}
              />

              <InfoItem
                label="Department ID"
                value={String(department.id)}
                mono
              />

            </div>
          </SectionCard>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">

          <p className="text-sm font-semibold text-slate-800">
            Department profile
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            Information is loaded directly from the HRMS database.
          </p>

        </div>

      </div>

    </DashboardLayout>
  );
}

export default DepartmentProfile;