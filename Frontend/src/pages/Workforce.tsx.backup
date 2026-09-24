import {
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  deleteEmployee,
  getEmployees,
  type Employee,
  type WorkforceDepartment,
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

  if (Number.isNaN(date.getTime())) {
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

const formatEmploymentType = (
  value: string,
): string => {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
};

const getStatusClasses = (
  status: string,
): string => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "ON_LEAVE":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "PROBATION":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "INACTIVE":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

function Workforce() {
  const navigate = useNavigate();

  const [
    employees,
    setEmployees,
  ] = useState<Employee[]>([]);

  const [
    departments,
    setDepartments,
  ] = useState<WorkforceDepartment[]>(
    [],
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    departmentId,
    setDepartmentId,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

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
  | Delete State
  |--------------------------------------------------------------------------
  */

  const [
    employeeToDelete,
    setEmployeeToDelete,
  ] = useState<Employee | null>(
    null,
  );

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Employees
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);

            setError("");

            const data =
              await getEmployees({
                search,
                departmentId,
                status,
              });

            setEmployees(
              data.employees,
            );

            setDepartments(
              data.departments,
            );
          } catch (requestError) {
            console.error(
              "Failed to load employees:",
              requestError,
            );

            setError(
              "Unable to load employees. Please make sure the backend and PostgreSQL are running.",
            );
          } finally {
            setLoading(false);
          }
        },
        search ? 300 : 0,
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    search,
    departmentId,
    status,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Derived Values
  |--------------------------------------------------------------------------
  */

  const totalEmployees =
    employees.length;

  const activeEmployees =
    useMemo(
      () =>
        employees.filter(
          (employee) =>
            employee.status ===
            "ACTIVE",
        ).length,
      [employees],
    );

  /*
  |--------------------------------------------------------------------------
  | Delete Employee
  |--------------------------------------------------------------------------
  */

  const handleDeleteEmployee =
    async () => {
      if (
        !employeeToDelete ||
        deleting
      ) {
        return;
      }

      const employee =
        employeeToDelete;

      try {
        setDeleting(true);

        setDeleteError("");

        setSuccessMessage("");

        await deleteEmployee(
          employee.id,
        );

        setEmployees(
          (currentEmployees) =>
            currentEmployees.filter(
              (currentEmployee) =>
                currentEmployee.id !==
                employee.id,
            ),
        );

        setSuccessMessage(
          `${employee.fullName} was permanently deleted successfully.`,
        );

        setEmployeeToDelete(null);
      } catch (requestError: any) {
        console.error(
          "Failed to delete employee:",
          requestError,
        );

        const response =
          requestError?.response;

        const statusCode =
          response?.status;

        const backendMessage =
          response?.data?.message;

        if (
          statusCode === 409
        ) {
          setDeleteError(
            backendMessage ||
              "This employee cannot be permanently deleted because related HR records exist. Deactivate the employee instead.",
          );

          return;
        }

        if (
          statusCode === 404
        ) {
          setDeleteError(
            "This employee no longer exists in the database.",
          );

          return;
        }

        setDeleteError(
          backendMessage ||
            "Unable to delete this employee. Please try again.",
        );
      } finally {
        setDeleting(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Export CSV
  |--------------------------------------------------------------------------
  */

  const handleExport = () => {
    if (
      employees.length === 0
    ) {
      return;
    }

    const headers = [
      "Employee ID",
      "Name",
      "Email",
      "Designation",
      "Department",
      "System Role",
      "Joining Date",
      "Status",
      "Employment Type",
    ];

    const rows =
      employees.map(
        (employee) => [
          employee.employeeCode,
          employee.fullName,
          employee.email,
          employee.designation,
          employee.department,
          employee.systemRole,
          employee.joiningDate,
          employee.status,
          employee.employmentType,
        ],
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value,
              ).replaceAll(
                '"',
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "aakam-employees.csv";

    link.click();

    URL.revokeObjectURL(url);
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* PAGE HEADER */}

        <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="m-0 text-[32px] font-semibold leading-10 tracking-tight text-slate-900">
              Employee Directory
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              {loading
                ? "Loading employees..."
                : `${totalEmployees.toLocaleString(
                    "en-IN",
                  )} Total Employees`}
            </p>

            {!loading &&
              totalEmployees >
                0 && (
                <p className="mt-1 text-xs text-slate-400">
                  {
                    activeEmployees
                  }{" "}
                  active employees
                  in the current
                  view
                </p>
              )}
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={handleExport}
              disabled={
                employees.length ===
                0
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />

              Export
            </button>

            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-slate-800 opacity-50"
            >
              <Upload size={15} />

              Import
            </button>

            <Link
              to="/workforce/employees/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold tracking-wide text-white transition hover:bg-teal-800"
            >
              <Plus size={16} />

              Add Employee
            </Link>

          </div>
        </section>

        {/* FILTER TOOLBAR */}

        <section className="rounded-xl border border-slate-300 bg-white p-4">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            <label className="relative w-full shrink-0 lg:w-96">

              <Search
                size={19}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by name, ID, email, or designation..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />

            </label>

            <div className="flex min-w-0 flex-1 flex-wrap gap-3">

              <select
                value={
                  departmentId
                }
                onChange={(event) =>
                  setDepartmentId(
                    event.target.value,
                  )
                }
                className="h-10 min-w-[150px] flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:flex-none"
              >
                <option value="">
                  Department
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={
                        department.id
                      }
                      value={
                        department.id
                      }
                    >
                      {
                        department.name
                      }
                    </option>
                  ),
                )}
              </select>

              <select
                disabled
                className="h-10 min-w-[150px] cursor-not-allowed flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-400 outline-none sm:flex-none"
              >
                <option>
                  Location
                </option>
              </select>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value,
                  )
                }
                className="h-10 min-w-[150px] flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:flex-none"
              >
                <option value="">
                  Status
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="PROBATION">
                  Probation
                </option>

                <option value="ON_LEAVE">
                  On Leave
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <button
                type="button"
                disabled
                className="ml-auto inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold tracking-wide text-slate-600 opacity-60"
              >
                <Filter size={15} />

                More Filters
              </button>

            </div>
          </div>
        </section>

        {/* SUCCESS */}

        {successMessage && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </section>
        )}

        {/* ERROR */}

        {error && (
          <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        )}

        {/* =====================================================
            EMPLOYEE TABLE

            Fixed 100% column distribution.

            No horizontal scrollbar at normal 100% desktop view.
        ===================================================== */}

        <section className="w-full overflow-hidden rounded-xl border border-slate-300 bg-white">

          <div className="w-full overflow-hidden">

            <table className="w-full table-fixed border-collapse">

              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
              </colgroup>

              <thead>
                <tr className="bg-slate-100">

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Employee
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Employee ID
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Designation
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Department
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    System Role
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Joining Date
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Employment Type
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Status
                  </th>

                  <th className="overflow-hidden px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                        <Users
                          size={18}
                          className="animate-pulse text-slate-500"
                        />
                      </div>

                      Loading employees...
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  employees.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center"
                      >
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <Users
                            size={18}
                            className="text-slate-500"
                          />
                        </div>

                        <p className="text-sm font-medium text-slate-800">
                          No employees found
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Try changing your
                          search or filters.
                        </p>
                      </td>
                    </tr>
                  )}

                {!loading &&
                  employees.map(
                    (employee) => (
                      <tr
                        key={employee.id}
                        onClick={() =>
                          navigate(
                            `/workforce/employees/${employee.id}`,
                          )
                        }
                        className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* EMPLOYEE */}

                        <td className="max-w-0 overflow-hidden px-3 py-3">

                          <Link
                            to={`/workforce/employees/${employee.id}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="flex min-w-0 items-center gap-2"
                          >

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">

                              {employee.firstName
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}

                              {employee.lastName
                                ?.charAt(
                                  0,
                                )
                                .toUpperCase()}

                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-medium text-teal-700 hover:underline">
                                {
                                  employee.fullName
                                }
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {
                                  employee.email
                                }
                              </p>

                            </div>

                          </Link>

                        </td>

                        {/* EMPLOYEE ID */}

                        <td className="max-w-0 overflow-hidden px-3 py-3 font-mono text-sm text-slate-700">
                          <span className="block truncate">
                            {
                              employee.employeeCode
                            }
                          </span>
                        </td>

                        {/* DESIGNATION */}

                        <td className="max-w-0 overflow-hidden px-3 py-3 text-sm text-slate-700">
                          <span className="block truncate">
                            {employee.designation ||
                              "-"}
                          </span>
                        </td>

                        {/* DEPARTMENT */}

                        <td className="max-w-0 overflow-hidden px-3 py-3 text-sm text-slate-700">
                          <span className="block truncate">
                            {
                              employee.department
                            }
                          </span>
                        </td>

                        {/* SYSTEM ROLE */}

                        <td className="max-w-0 overflow-hidden px-3 py-3">

                          <span className="block max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-medium text-slate-700">
                            {
                              employee.systemRole
                            }
                          </span>

                        </td>

                        {/* JOINING DATE */}

                        <td className="max-w-0 overflow-hidden px-3 py-3 text-sm text-slate-700">
                          <span className="block truncate whitespace-nowrap">
                            {formatDate(
                              employee.joiningDate,
                            )}
                          </span>
                        </td>

                        {/* EMPLOYMENT TYPE */}

                        <td className="max-w-0 overflow-hidden px-3 py-3 text-sm text-slate-700">
                          <span className="block truncate">
                            {formatEmploymentType(
                              employee.employmentType,
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="max-w-0 overflow-hidden px-3 py-3">

                          <span
                            className={`inline-flex max-w-full items-center truncate rounded-full border px-2 py-1 text-xs font-medium ${getStatusClasses(
                              employee.status,
                            )}`}
                          >
                            {formatEmploymentType(
                              employee.status,
                            )}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td
                          className="px-2 py-3"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >

                          <div className="flex items-center justify-center gap-1">

                            {/* EDIT */}

                            <Link
                              to={`/workforce/employees/${employee.id}/edit`}
                              title="Edit Employee"
                              aria-label={`Edit ${employee.fullName}`}
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Pencil
                                size={17}
                                strokeWidth={1.8}
                              />
                            </Link>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete Employee"
                              aria-label={`Delete ${employee.fullName}`}
                              onClick={(
                                event,
                              ) => {
                                event.stopPropagation();

                                setSuccessMessage(
                                  "",
                                );

                                setDeleteError(
                                  "",
                                );

                                setEmployeeToDelete(
                                  employee,
                                );
                              }}
                              disabled={
                                deleting
                              }
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2
                                size={17}
                                strokeWidth={1.8}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    ),
                  )}

              </tbody>

            </table>

          </div>

        </section>

        {/* DELETE MODAL */}

        {employeeToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">

            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">

              <div className="mb-5 flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <Trash2 size={20} />
                </div>

                <div>

                  <h2 className="text-lg font-semibold text-slate-900">
                    Delete Employee?
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">

                    Are you sure you want to
                    permanently delete{" "}

                    <span className="font-semibold text-slate-800">
                      {
                        employeeToDelete.fullName
                      }
                    </span>
                    ?

                  </p>

                </div>

              </div>

              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">

                <p className="text-xs leading-5 text-amber-800">
                  This permanently removes
                  the employee from the database
                  if there are no related HR
                  records. Employees with related
                  records must be deactivated
                  instead.
                </p>

              </div>

              {deleteError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm leading-5 text-red-700">
                    {deleteError}
                  </p>

                </div>
              )}

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => {
                    if (deleting) {
                      return;
                    }

                    setEmployeeToDelete(
                      null,
                    );

                    setDeleteError(
                      "",
                    );
                  }}
                  disabled={deleting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleDeleteEmployee
                  }
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={15} />

                  {deleting
                    ? "Deleting..."
                    : "Delete Employee"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default Workforce;