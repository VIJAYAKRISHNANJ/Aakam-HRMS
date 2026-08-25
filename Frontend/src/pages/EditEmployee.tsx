import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Loader2,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";
import {
  getEmployeeById,
  getEmployees,
  updateEmployee,
  type WorkforceDepartment,
} from "../services/workforceService";

interface EditEmployeeForm {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  joiningDate: string;
  employmentStatus: string;
  employmentType: string;
}

type FormErrors = Partial<
  Record<keyof EditEmployeeForm, string>
>;

const emptyForm: EditEmployeeForm = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  departmentId: "",
  joiningDate: "",
  employmentStatus: "ACTIVE",
  employmentType: "FULL_TIME",
};

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "PROBATION", label: "Probation" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "INACTIVE", label: "Inactive" },
];

const employmentTypeOptions = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const getFieldClasses = (
  hasError: boolean,
): string =>
  [
    "h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-800 outline-none transition",
    "placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
      : "border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10",
  ].join(" ");

const toDateInputValue = (
  value: string,
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

function EditEmployee() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] =
    useState<EditEmployeeForm>(emptyForm);
  const [errors, setErrors] =
    useState<FormErrors>({});
  const [departments, setDepartments] =
    useState<WorkforceDepartment[]>([]);
  const [departmentsLoading, setDepartmentsLoading] =
    useState(true);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [submitError, setSubmitError] =
    useState("");
  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setLoadError(
          "Employee ID is missing.",
        );
        setPageLoading(false);
        setDepartmentsLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        setDepartmentsLoading(true);
        setLoadError("");

        const [employee, directoryData] =
          await Promise.all([
            getEmployeeById(id),
            getEmployees(),
          ]);

        setForm({
          employeeCode:
            employee.employeeCode,
          firstName: employee.firstName,
          lastName:
            employee.lastName ?? "",
          email: employee.email,
          departmentId:
            employee.departmentId
              ? String(
                  employee.departmentId,
                )
              : "",
          joiningDate: toDateInputValue(
            employee.joiningDate,
          ),
          employmentStatus:
            employee.status,
          employmentType:
            employee.employmentType,
        });

        setDepartments(
          directoryData.departments,
        );
      } catch (requestError) {
        console.error(
          "Failed to load employee for editing:",
          requestError,
        );

        setLoadError(
          "Unable to load employee details. Please make sure the backend and PostgreSQL are running.",
        );
      } finally {
        setPageLoading(false);
        setDepartmentsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange =
    (field: keyof EditEmployeeForm) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >,
    ) => {
      const { value } = event.target;

      setForm((previous) => ({
        ...previous,
        [field]: value,
      }));

      setErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.employeeCode.trim()) {
      nextErrors.employeeCode =
        "Employee code is required.";
    }

    if (!form.firstName.trim()) {
      nextErrors.firstName =
        "First name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email =
        "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    if (!form.departmentId) {
      nextErrors.departmentId =
        "Department is required.";
    }

    if (!form.joiningDate) {
      nextErrors.joiningDate =
        "Joining date is required.";
    }

    if (!form.employmentStatus) {
      nextErrors.employmentStatus =
        "Employment status is required.";
    }

    if (!form.employmentType) {
      nextErrors.employmentType =
        "Employment type is required.";
    }

    return nextErrors;
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (submitting || success || !id) {
      return;
    }

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      await updateEmployee(id, {
        employeeCode: form.employeeCode.trim(),
        firstName: form.firstName.trim(),
        lastName:
          form.lastName.trim() || undefined,
        email: form.email.trim(),
        departmentId: Number(form.departmentId),
        joiningDate: form.joiningDate,
        employmentStatus: form.employmentStatus,
        employmentType: form.employmentType,
      });

      setSuccess(true);

      window.setTimeout(() => {
        navigate(`/workforce/employees/${id}`);
      }, 900);
    } catch (requestError: unknown) {
      console.error(
        "Failed to update employee:",
        requestError,
      );

      const backendMessage = (
        requestError as {
          response?: {
            data?: { message?: string };
          };
        }
      )?.response?.data?.message;

      setSubmitError(
        backendMessage ||
          "Unable to update employee. Please check the details and try again.",
      );
      setSubmitting(false);
    }
  };

  const fieldDisabled = submitting || success;

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="dashboard-card w-full max-w-md px-6 py-10 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Loader2
                size={24}
                className="animate-spin"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Loading employee details
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Fetching the latest employee information so you can update the record.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[520px] items-center justify-center">
          <div className="dashboard-card w-full max-w-lg px-6 py-10 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <CircleAlert size={24} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Unable to load employee
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {loadError}
            </p>

            <Link
              to="/workforce"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
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
      <div className="flex w-full min-w-0 max-w-5xl flex-col gap-6">
        <Link
          to={`/workforce/employees/${id}`}
          className="inline-flex w-fit items-center gap-2 rounded-full px-1 text-sm font-medium text-slate-600 transition hover:text-teal-700"
        >
          <ArrowLeft size={17} />
          Back to Employee Profile
        </Link>

        <section>
          <h1 className="m-0 text-[32px] font-semibold leading-10 tracking-tight text-slate-900">
            Edit Employee
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Update employee information while keeping the existing workforce record accurate.
          </p>
        </section>

        {submitError && (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <CircleAlert
                size={18}
                className="mt-0.5 shrink-0"
              />
              <div>
                <p className="font-semibold text-red-800">
                  Unable to save changes
                </p>
                <p className="mt-1 leading-6">
                  {submitError}
                </p>
              </div>
            </div>
          </section>
        )}

        {success && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-700">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
              <div>
                <p className="font-semibold text-emerald-800">
                  Employee updated successfully
                </p>
                <p className="mt-1 leading-6">
                  Redirecting to the employee profile with the latest details.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="dashboard-card overflow-hidden">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-10 px-6 py-6 sm:px-8 sm:py-8">
              <section>
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-slate-900">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Maintain the employee's core identity and contact details.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Employee Code
                    </label>
                    <input
                      type="text"
                      value={form.employeeCode}
                      onChange={handleChange(
                        "employeeCode",
                      )}
                      disabled={fieldDisabled}
                      placeholder="e.g. AAK011"
                      className={getFieldClasses(
                        Boolean(
                          errors.employeeCode,
                        ),
                      )}
                    />
                    {errors.employeeCode && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.employeeCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange(
                        "email",
                      )}
                      disabled={fieldDisabled}
                      placeholder="name@aakam.com"
                      className={getFieldClasses(
                        Boolean(errors.email),
                      )}
                    />
                    {errors.email && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={handleChange(
                        "firstName",
                      )}
                      disabled={fieldDisabled}
                      placeholder="e.g. Arun"
                      className={getFieldClasses(
                        Boolean(
                          errors.firstName,
                        ),
                      )}
                    />
                    {errors.firstName && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={handleChange(
                        "lastName",
                      )}
                      disabled={fieldDisabled}
                      placeholder="e.g. Kumar (optional)"
                      className={getFieldClasses(
                        false,
                      )}
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-100 pt-8">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-slate-900">
                    Employment Information
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update department and employment details used in workforce operations.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Department
                    </label>
                    <select
                      value={form.departmentId}
                      onChange={handleChange(
                        "departmentId",
                      )}
                      disabled={
                        fieldDisabled ||
                        departmentsLoading
                      }
                      className={getFieldClasses(
                        Boolean(
                          errors.departmentId,
                        ),
                      )}
                    >
                      <option value="">
                        {departmentsLoading
                          ? "Loading departments..."
                          : "Select department"}
                      </option>
                      {departments.map((department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.departmentId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={handleChange(
                        "joiningDate",
                      )}
                      disabled={fieldDisabled}
                      className={getFieldClasses(
                        Boolean(
                          errors.joiningDate,
                        ),
                      )}
                    />
                    {errors.joiningDate && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.joiningDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Employment Status
                    </label>
                    <select
                      value={form.employmentStatus}
                      onChange={handleChange(
                        "employmentStatus",
                      )}
                      disabled={fieldDisabled}
                      className={getFieldClasses(
                        false,
                      )}
                    >
                      {statusOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Employment Type
                    </label>
                    <select
                      value={form.employmentType}
                      onChange={handleChange(
                        "employmentType",
                      )}
                      disabled={fieldDisabled}
                      className={getFieldClasses(
                        false,
                      )}
                    >
                      {employmentTypeOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={`/workforce/employees/${id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={fieldDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}
                  {submitting
                    ? "Saving Changes..."
                    : success
                      ? "Saved"
                      : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default EditEmployee;
