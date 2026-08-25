import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  Pencil,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import {
  getEmployeeById,
  type Employee,
} from "../services/workforceService";

const formatDate = (value: string): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatValue = (value: string): string => {
  if (!value) return "-";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getInitials = (employee: Employee): string => {
  const first = employee.firstName?.charAt(0)?.toUpperCase() ?? "";
  const last = employee.lastName?.charAt(0)?.toUpperCase() ?? "";

  return `${first}${last}`;
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
            mono ? "font-mono" : ""
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
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${className}`}
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

      <div className="p-5">{children}</div>
    </section>
  );
}

function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployee = async () => {
      if (!id) {
        setError("Employee ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getEmployeeById(id);
        setEmployee(data);
      } catch (requestError) {
        console.error(
          "Failed to load employee profile:",
          requestError,
        );

        setError("Unable to load employee profile.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id]);

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

  if (error || !employee) {
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
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to Workforce
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full min-w-0 space-y-5">
        {/* Breadcrumb / Back */}
        <div>
          <Link
            to="/workforce"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
          >
            <ArrowLeft size={16} />
            Workforce
          </Link>
        </div>

        {/* Employee Header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-xl font-bold text-white shadow-sm">
                {getInitials(employee)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {employee.fullName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {formatValue(employee.status)}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                  <span className="font-mono font-medium text-slate-600">
                    {employee.employeeCode}
                  </span>

                  <span className="text-slate-300">•</span>

                  <span>{employee.department}</span>

                  <span className="text-slate-300">•</span>

                  <span>
                    {formatValue(employee.employmentType)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/workforce"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">
                  Back
                </span>
              </Link>

              <Link
                to={`/workforce/employees/${employee.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Pencil size={15} />
                Edit Employee
              </Link>
            </div>
          </div>
        </section>

        {/* Main Information */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Personal Information */}
          <SectionCard
            icon={<User size={18} />}
            title="Personal Information"
            description="Basic employee identity and contact details"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <InfoItem
                label="First Name"
                value={employee.firstName}
              />

              <InfoItem
                label="Last Name"
                value={employee.lastName || "-"}
              />

              <InfoItem
                label="Work Email"
                value={employee.email}
                icon={<Mail size={15} />}
              />

              <InfoItem
                label="Employee Code"
                value={employee.employeeCode}
                mono
              />
            </div>
          </SectionCard>

          {/* Employment */}
          <SectionCard
            icon={<BriefcaseBusiness size={18} />}
            title="Employment"
            description="Current employment information"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <InfoItem
                label="Department"
                value={employee.department}
              />

              <InfoItem
                label="Employment Type"
                value={formatValue(
                  employee.employmentType,
                )}
              />

              <InfoItem
                label="Joining Date"
                value={formatDate(employee.joiningDate)}
                icon={<CalendarDays size={15} />}
              />

              <InfoItem
                label="Status"
                value={formatValue(employee.status)}
              />
            </div>
          </SectionCard>

          {/* Organization */}
          <SectionCard
            icon={<Users size={18} />}
            title="Organization"
            description="Employee organization details"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <InfoItem
                label="Department"
                value={employee.department}
              />

              <InfoItem
                label="Department ID"
                value={
                  employee.departmentId?.toString() || "-"
                }
                mono
              />
            </div>
          </SectionCard>

          {/* Record */}
          <SectionCard
            icon={<CalendarDays size={18} />}
            title="Record Information"
            description="System record details"
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <InfoItem
                label="Created"
                value={formatDate(employee.createdAt)}
              />

              <InfoItem
                label="Employee ID"
                value={employee.employeeCode}
                mono
              />
            </div>
          </SectionCard>
        </div>

        {/* Bottom Summary */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Employee profile
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Information is loaded directly from the HRMS
              database.
            </p>
          </div>

          <Link
            to={`/workforce/employees/${employee.id}/edit`}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil size={15} />
            Update Information
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default EmployeeProfile;