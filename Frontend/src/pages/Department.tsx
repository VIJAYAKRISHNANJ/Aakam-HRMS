import {
  Edit3,
  Layers3,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import OrganizationNav from "../components/organization/OrganizationNav";

import { useAuth } from "../context/AuthContext";

import {
  deleteDepartment,
  getDepartments,
} from "../services/departmentService";

import type {
  Department as DepartmentType,
} from "../services/departmentService";

function Department() {
  const navigate = useNavigate();

  const { hasPermission } = useAuth();

  const canDeleteDepartments =
    hasPermission(
      "departments.delete",
    );

  const [
    departments,
    setDepartments,
  ] = useState<DepartmentType[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    deletingDepartment,
    setDeletingDepartment,
  ] = useState<DepartmentType | null>(
    null,
  );

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Departments
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadDepartments =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getDepartments();

          setDepartments(data);
        } catch (requestError) {
          console.error(
            "Failed to load departments:",
            requestError,
          );

          setError(
            "Unable to load department information. Please make sure the backend is running.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadDepartments();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open Department Profile
  |--------------------------------------------------------------------------
  */

  const openDepartmentProfile = (
    departmentId: number,
  ) => {
    navigate(
      `/organization/departments/${departmentId}`,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Department
  |--------------------------------------------------------------------------
  */

  const handleDeleteDepartment =
    async () => {
      if (!deletingDepartment) {
        return;
      }

      try {
        setDeleting(true);
        setError("");

        await deleteDepartment(
          deletingDepartment.id,
        );

        setDepartments(
          (currentDepartments) =>
            currentDepartments.filter(
              (department) =>
                department.id !==
                deletingDepartment.id,
            ),
        );

        setDeletingDepartment(null);
      } catch (requestError) {
        console.error(
          "Failed to delete department:",
          requestError,
        );

        let message =
          "Unable to delete the department. Please try again.";

        if (
          requestError &&
          typeof requestError === "object" &&
          "response" in requestError
        ) {
          const response =
            (
              requestError as {
                response?: {
                  data?: {
                    message?: string;
                  };
                };
              }
            ).response;

          if (
            response?.data?.message
          ) {
            message =
              response.data.message;
          }
        }

        setError(message);
        setDeletingDepartment(null);
      } finally {
        setDeleting(false);
      }
    };

  return (
    <DashboardLayout>

      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="flex flex-col gap-4">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">

                  <Layers3
                    size={22}
                    className="text-teal-700"
                  />

                </div>

                <div>

                  <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                    Departments
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    Manage your organization
                    departments and teams.
                  </p>

                </div>

              </div>

            </div>

            <Link
              to="/organization/departments/new"
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-teal-700
                px-4
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-teal-800
              "
            >
              <Layers3 size={16} />

              Add Department
            </Link>

          </div>

        </section>

        {/* =================================================
            ORGANIZATION NAVIGATION
        ================================================= */}

        <OrganizationNav />

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        )}

        {/* =================================================
            DEPARTMENT CARD
        ================================================= */}

        <section className="rounded-xl border border-slate-300 bg-white shadow-sm">

          {/* =================================================
              CARD HEADER
          ================================================= */}

          <div className="flex flex-col gap-1 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-base font-semibold text-slate-900">
                Organization Departments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {departments.length}{" "}
                {departments.length === 1
                  ? "department"
                  : "departments"}{" "}
                configured
              </p>

            </div>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="px-6 py-16 text-center">

              <Layers3
                size={24}
                className="mx-auto mb-3 animate-pulse text-slate-400"
              />

              <p className="text-sm text-slate-500">
                Loading departments...
              </p>

            </div>
          ) : departments.length === 0 ? (

            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

                <Layers3
                  size={22}
                  className="text-slate-500"
                />

              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No departments found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create your first department
                to get started.
              </p>

              <Link
                to="/organization/departments/new"
                className="
                  mt-5
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-teal-700
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-teal-800
                "
              >
                Add Department
              </Link>

            </div>
          ) : (

            /* =================================================
               TABLE
            ================================================= */

            <div className="overflow-x-auto">

              <table className="w-full min-w-[800px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50/80">

                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Employees
                    </th>

                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {departments.map(
                    (department) => (
                      <tr
                        key={department.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          openDepartmentProfile(
                            department.id,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            event.preventDefault();

                            openDepartmentProfile(
                              department.id,
                            );
                          }
                        }}
                        className="
                          cursor-pointer
                          border-b
                          border-slate-100
                          last:border-0
                          hover:bg-slate-50/60
                        "
                      >

                        {/* Department */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">

                              <Layers3
                                size={17}
                                className="text-teal-700"
                              />

                            </div>

                            <div>

                              <p className="text-sm font-semibold text-slate-900">
                                {department.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                Department ID:{" "}
                                {department.id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* Code */}

                        <td className="px-6 py-4">

                          <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                            {department.code}
                          </span>

                        </td>

                        {/* Employees */}

                        <td className="px-6 py-4 text-center">

                          <span className="text-sm font-semibold text-slate-800">
                            {department.employeeCount}
                          </span>

                        </td>

                        {/* Action */}

                        <td
                          className="px-6 py-4 text-right"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          onKeyDown={(event) =>
                            event.stopPropagation()
                          }
                        >

                          <div className="flex flex-wrap justify-end gap-2">

                            <Link
                              to={`/organization/departments/edit/${department.id}`}
                              className="
                                inline-flex
                                h-9
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                border
                                border-slate-300
                                bg-white
                                px-3
                                text-sm
                                font-medium
                                text-slate-700
                                transition
                                hover:border-teal-300
                                hover:bg-teal-50
                                hover:text-teal-700
                              "
                            >

                              <Edit3
                                size={15}
                              />

                              Edit

                            </Link>

                            {canDeleteDepartments && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeletingDepartment(
                                    department,
                                  )
                                }
                                className="
                                  inline-flex
                                  h-9
                                  items-center
                                  justify-center
                                  gap-2
                                  rounded-lg
                                  border
                                  border-red-200
                                  bg-white
                                  px-3
                                  text-sm
                                  font-medium
                                  text-red-600
                                  transition
                                  hover:border-red-300
                                  hover:bg-red-50
                                "
                              >

                                <Trash2
                                  size={15}
                                />

                                Delete

                              </button>
                            )}

                          </div>

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {deletingDepartment && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            px-4
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-department-title"
        >

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">

                  <Trash2
                    size={21}
                    className="text-red-600"
                  />

                </div>

                <div className="min-w-0">

                  <h2
                    id="delete-department-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Delete Department
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Are you sure you want to
                    delete{" "}
                    <span className="font-semibold text-slate-900">
                      {deletingDepartment.name}
                    </span>
                    ?
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    If this department is being
                    used by employees or other
                    records, the backend will
                    prevent deletion.
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeletingDepartment(null)
                }
                className="
                  inline-flex
                  items-center
                  justify-center
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
                  hover:bg-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={
                  handleDeleteDepartment
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-red-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                <Trash2 size={16} />

                {deleting
                  ? "Deleting..."
                  : "Delete Department"}

              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}

export default Department;