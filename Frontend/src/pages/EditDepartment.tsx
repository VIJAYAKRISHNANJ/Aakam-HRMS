import {
  ArrowLeft,
  Building2,
  Save,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import OrganizationNav from "../components/organization/OrganizationNav";

import {
  getDepartmentById,
  updateDepartment,
} from "../services/departmentService";

function EditDepartment() {
  const {
    id,
  } = useParams<{
    id: string;
  }>();

  const navigate =
    useNavigate();

  const [
    name,
    setName,
  ] = useState("");

  const [
    code,
    setCode,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Department
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadDepartment =
      async () => {
        if (!id) {
          setError(
            "Invalid department ID.",
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const department =
            await getDepartmentById(id);

          setName(
            department.name,
          );

          setCode(
            department.code,
          );
        } catch (requestError) {
          console.error(
            "Failed to load department:",
            requestError,
          );

          setError(
            "Unable to load department information. Please make sure the backend is running.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadDepartment();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (!id) {
      setError(
        "Invalid department ID.",
      );

      return;
    }

    const trimmedName =
      name.trim();

    const trimmedCode =
      code.trim().toUpperCase();

    if (!trimmedName) {
      setError(
        "Department name is required.",
      );

      return;
    }

    if (!trimmedCode) {
      setError(
        "Department code is required.",
      );

      return;
    }

    try {
      setSaving(true);

      await updateDepartment(
        id,
        {
          name: trimmedName,
          code: trimmedCode,
        },
      );

      navigate(
        "/organization/departments",
      );
    } catch (requestError) {
      console.error(
        "Failed to update department:",
        requestError,
      );

      setError(
        "Unable to update department. Please check the department name and code, then try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>

      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section>

          {/* =================================================
              CHANGE 5
              BACK BUTTON ABOVE EDIT DEPARTMENT TITLE
          ================================================= */}

          <div className="mb-4">

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
              aria-label="Back to Departments"
            >
              <ArrowLeft size={16} />
              Back to Departments
            </Link>

          </div>

          {/* TITLE */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">

              <Building2
                size={22}
                className="text-teal-700"
              />

            </div>

            <div>

              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Edit Department
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Update the department
                information.
              </p>

            </div>

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
          <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">

            <Building2
              size={24}
              className="mx-auto mb-3 animate-pulse text-slate-400"
            />

            <p className="text-sm text-slate-500">
              Loading department...
            </p>

          </section>
        ) : (
          <section className="w-full rounded-xl border border-slate-300 bg-white">

            {/* FORM HEADER */}

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-base font-semibold text-slate-900">
                Department Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the basic information
                for this department.
              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="w-full p-6"
            >

              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">

                {/* Department Name */}

                <div>

                  <label
                    htmlFor="department-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Department Name

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="department-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Finance"
                    disabled={saving}
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-3
                      text-sm
                      text-slate-800
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-teal-600
                      focus:ring-2
                      focus:ring-teal-600/20
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />

                </div>

                {/* Department Code */}

                <div>

                  <label
                    htmlFor="department-code"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Department Code

                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="department-code"
                    type="text"
                    value={code}
                    onChange={(event) =>
                      setCode(
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="e.g. FIN"
                    maxLength={20}
                    disabled={saving}
                    className="
                      h-11
                      w-full
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-3
                      font-mono
                      text-sm
                      uppercase
                      text-slate-800
                      outline-none
                      transition
                      placeholder:font-sans
                      placeholder:normal-case
                      placeholder:text-slate-400
                      focus:border-teal-600
                      focus:ring-2
                      focus:ring-teal-600/20
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />

                  <p className="mt-1.5 text-xs text-slate-500">
                    Use a short unique code such
                    as ENG, HR, or FIN.
                  </p>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">

                <Link
                  to="/organization/departments"
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-4
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    inline-flex
                    h-10
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-teal-700
                    px-5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-teal-800
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  <Save size={16} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </form>

          </section>
        )}

      </div>

    </DashboardLayout>
  );
}

export default EditDepartment;