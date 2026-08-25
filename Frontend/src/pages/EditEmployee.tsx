import {
  ArrowLeft,
  CheckCircle2,
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

/*
|--------------------------------------------------------------------------
| Form State
|--------------------------------------------------------------------------
*/

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

type FormErrors = Partial<
  Record<keyof EditEmployeeForm, string>
>;

/*
|--------------------------------------------------------------------------
| Options
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | Load existing employee + departments (real PostgreSQL data)
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

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
      nextErrors.email = "Email is required.";
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

    // Guard against duplicate submission
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

      // Brief pause so the success state is visible before navigating
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
            status?: number;
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

  /*
  |--------------------------------------------------------------------------
  | Loading / load-error states
  |--------------------------------------------------------------------------
  */

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

            <p className="text-sm text-slate-500">
              Loading employee details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-red-700">
              {loadError}
            </p>

            <Link
              to="/workforce"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
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
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 max-w-3xl flex-col gap-6">
        {/* =================================================
            BACK
        ================================================= */}

        <Link
          to={`/workforce/employees/${id}`}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700"
        >
          <ArrowLeft size={17} />
          Back to Employee Profile
        </Link>

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <h1 className="m-0 text-[32px] font-semibold leading-10 tracking-tight text-slate-900">
            Edit Employee
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Update this employee's details in
            Aakam HRMS.
          </p>
        </div>

        {/* =================================================
            SUBMIT ERROR
        ================================================= */}

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={17} />
            Employee updated successfully.
            Redirecting to their profile...
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <section className="dashboard-card p-5 sm:p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* EMPLOYEE CODE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.employeeCode
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-teal-600 focus:ring-teal-600/20"
                  }`}
                />

                {errors.employeeCode && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.employeeCode}
                  </p>
                )}
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  disabled={fieldDisabled}
                  placeholder="name@aakam.com"
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-teal-600 focus:ring-teal-600/20"
                  }`}
                />

                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* FIRST NAME */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.firstName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-teal-600 focus:ring-teal-600/20"
                  }`}
                />

                {errors.firstName && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* LAST NAME */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              {/* DEPARTMENT */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.departmentId
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-teal-600 focus:ring-teal-600/20"
                  }`}
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
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.departmentId}
                  </p>
                )}
              </div>

              {/* JOINING DATE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Joining Date
                </label>

                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={handleChange(
                    "joiningDate",
                  )}
                  disabled={fieldDisabled}
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                    errors.joiningDate
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-300 focus:border-teal-600 focus:ring-teal-600/20"
                  }`}
                />

                {errors.joiningDate && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.joiningDate}
                  </p>
                )}
              </div>

              {/* EMPLOYMENT STATUS */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employment Status
                </label>

                <select
                  value={form.employmentStatus}
                  onChange={handleChange(
                    "employmentStatus",
                  )}
                  disabled={fieldDisabled}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
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

              {/* EMPLOYMENT TYPE */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employment Type
                </label>

                <select
                  value={form.employmentType}
                  onChange={handleChange(
                    "employmentType",
                  )}
                  disabled={fieldDisabled}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
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

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <Link
                to={`/workforce/employees/${id}`}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={fieldDisabled}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold tracking-wide text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                {submitting
                  ? "Saving..."
                  : success
                    ? "Saved"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default EditEmployee;
