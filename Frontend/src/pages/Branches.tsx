import {
  Building2,
  Edit,
  MapPin,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import OrganizationNav from "../components/organization/OrganizationNav";

import {
  deleteBranch,
  getBranches,
  type Branch,
} from "../services/branchService";

function Branches() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canViewBranches =
    hasPermission("branches.view");

  const canCreateBranches =
    hasPermission("branches.create");

  const canUpdateBranches =
    hasPermission("branches.update");

  const canDeleteBranches =
    hasPermission("branches.delete");

  const [
    branches,
    setBranches,
  ] = useState<Branch[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    companyId,
    setCompanyId,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    companies,
    setCompanies,
  ] = useState<
    {
      id: number;
      companyCode: string;
      displayName: string;
      legalName: string;
    }[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    deletingBranch,
    setDeletingBranch,
  ] = useState<Branch | null>(null);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load Branches
  |--------------------------------------------------------------------------
  */

  const loadBranches = async () => {
    if (!canViewBranches) {
      setBranches([]);
      setCompanies([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getBranches({
          search,
          companyId,
          status,
        });

      setBranches(data.branches);
      setCompanies(data.companies);
    } catch (requestError) {
      console.error(
        "Failed to load branches:",
        requestError,
      );

      setError(
        "Unable to load branches. Please make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Load + Filter Changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!canViewBranches) {
      setBranches([]);
      setCompanies([]);
      setLoading(false);
      setError("");
      return;
    }

    const timer =
      window.setTimeout(() => {
        loadBranches();
      }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    search,
    companyId,
    status,
    canViewBranches,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Format Status
  |--------------------------------------------------------------------------
  */

  const formatStatus = (
    value: string,
  ) => {
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
  | Open Branch Profile
  |--------------------------------------------------------------------------
  */

  const openBranchProfile = (
    branchId: number,
  ) => {
    navigate(
      `/organization/branches/${branchId}`,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Branch
  |--------------------------------------------------------------------------
  */

  const handleDeleteBranch =
    async () => {
      if (!deletingBranch) {
        return;
      }

      try {
        setDeleting(true);
        setError("");

        await deleteBranch(
          deletingBranch.id,
        );

        setBranches(
          (currentBranches) =>
            currentBranches.filter(
              (branch) =>
                branch.id !==
                deletingBranch.id,
            ),
        );

        setDeletingBranch(null);
      } catch (requestError) {
        console.error(
          "Failed to delete branch:",
          requestError,
        );

        let message =
          "Unable to delete the branch. Please try again.";

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
        setDeletingBranch(null);
      } finally {
        setDeleting(false);
      }
    };

  if (!canViewBranches) {
    return (
      <DashboardLayout>

        <div className="flex min-h-[60vh] w-full items-center justify-center">

          <section className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">

              <Building2
                size={24}
                className="text-red-600"
              />

            </div>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Access Restricted
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You do not have permission to view company branches.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
              className="
                mt-6
                inline-flex
                items-center
                justify-center
                rounded-lg
                bg-teal-700
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-teal-800
              "
            >
              Back to Dashboard
            </button>

          </section>

        </div>

      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">

              <Building2
                size={22}
                className="text-teal-700"
              />

            </div>

            <div>

              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Branches
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Manage company branches and
                locations.
              </p>

            </div>

          </div>

          {canCreateBranches && (
            <Link
              to="/organization/branches/new"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-teal-700
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-teal-800
              "
            >
              <Plus size={16} />
              Add Branch
            </Link>
          )}

        </section>

        {/* =================================================
            ORGANIZATION NAVIGATION
        ================================================= */}

        <OrganizationNav />

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="rounded-xl border border-slate-300 bg-white p-4">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">

            {/* Search */}

            <div className="relative">

              <Search
                size={17}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search branch, code, location..."
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-teal-600
                  focus:ring-2
                  focus:ring-teal-600/20
                "
              />

            </div>

            {/* Company */}

            <select
              value={companyId}
              onChange={(event) =>
                setCompanyId(
                  event.target.value,
                )
              }
              className="
                h-10
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
                focus:border-teal-600
                focus:ring-2
                focus:ring-teal-600/20
              "
            >

              <option value="">
                All Companies
              </option>

              {companies.map(
                (company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.displayName}
                  </option>
                ),
              )}

            </select>

            {/* Status */}

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
              className="
                h-10
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
                focus:border-teal-600
                focus:ring-2
                focus:ring-teal-600/20
              "
            >

              <option value="">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

            </select>

          </div>

        </section>

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

        {loading && (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">

            <Building2
              size={28}
              className="mx-auto mb-3 animate-pulse text-slate-400"
            />

            <p className="text-sm text-slate-500">
              Loading branches...
            </p>

          </section>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          branches.length === 0 && (
            <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">

              <Building2
                size={34}
                className="mx-auto mb-3 text-slate-400"
              />

              <h2 className="text-base font-semibold text-slate-900">
                No branches found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create a branch to get
                started.
              </p>

              {canCreateBranches && (
                <Link
                  to="/organization/branches/new"
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-teal-700
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-teal-800
                  "
                >
                  <Plus size={16} />
                  Add Branch
                </Link>
              )}

            </section>
          )}

        {/* =================================================
            BRANCH LIST
        ================================================= */}

        {!loading &&
          !error &&
          branches.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">

              {/* Table Header */}

              <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-3 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_180px] md:gap-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Branch
                </p>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </p>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Location
                </p>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </p>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <p className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </p>

              </div>

              {/* Rows */}

              <div className="divide-y divide-slate-200">

                {branches.map(
                  (branch) => (
                    <div
                      key={branch.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        openBranchProfile(
                          branch.id,
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

                          openBranchProfile(
                            branch.id,
                          );
                        }
                      }}
                      className="
                        grid
                        cursor-pointer
                        grid-cols-1
                        gap-4
                        px-6
                        py-5
                        transition
                        hover:bg-slate-50
                        md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_180px]
                        md:items-center
                        md:gap-4
                      "
                    >

                      {/* Branch */}

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">

                          <Building2
                            size={18}
                            className="text-teal-700"
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {branch.branchName}
                          </p>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {branch.branchCode}
                          </p>

                        </div>

                      </div>

                      {/* Company */}

                      <div>

                        <p className="text-sm font-medium text-slate-800">
                          {branch.companyName}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {branch.companyCode}
                        </p>

                      </div>

                      {/* Location */}

                      <div className="flex items-start gap-2">

                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div>

                          <p className="text-sm font-medium text-slate-800">
                            {branch.location ||
                              "-"}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {branch.address ||
                              "-"}
                          </p>

                        </div>

                      </div>

                      {/* Contact */}

                      <div className="space-y-1">

                        {branch.email && (
                          <div className="flex items-center gap-2">

                            <Mail
                              size={14}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="truncate text-xs text-slate-600">
                              {branch.email}
                            </span>

                          </div>
                        )}

                        {branch.phone && (
                          <div className="flex items-center gap-2">

                            <Phone
                              size={14}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="text-xs text-slate-600">
                              {branch.phone}
                            </span>

                          </div>
                        )}

                        {!branch.email &&
                          !branch.phone && (
                            <span className="text-xs text-slate-400">
                              -
                            </span>
                          )}

                      </div>

                      {/* Status */}

                      <div>

                        <span
                          className={`
                            inline-flex
                            rounded-full
                            px-2.5
                            py-1
                            text-xs
                            font-medium
                            ${
                              branch.status ===
                              "ACTIVE"
                                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border border-slate-200 bg-slate-100 text-slate-600"
                            }
                          `}
                        >
                          {formatStatus(
                            branch.status,
                          )}
                        </span>

                      </div>

                      {/* Actions */}

                      <div
                        className="flex flex-wrap justify-start gap-2 md:justify-end"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                        onKeyDown={(event) =>
                          event.stopPropagation()
                        }
                      >

                        {canUpdateBranches && (
                          <Link
                            to={`/organization/branches/edit/${branch.id}`}
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-lg
                              border
                              border-slate-300
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-slate-700
                              transition
                              hover:bg-slate-50
                            "
                          >
                            <Edit size={14} />
                            Edit
                          </Link>
                        )}

                        {canDeleteBranches && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingBranch(
                                branch,
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-2
                              rounded-lg
                              border
                              border-red-200
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-red-600
                              transition
                              hover:border-red-300
                              hover:bg-red-50
                            "
                          >
                            <Trash2
                              size={14}
                            />
                            Delete
                          </button>
                        )}

                      </div>

                    </div>
                  ),
                )}

              </div>

            </section>
          )}

      </div>

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {deletingBranch && (
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
          aria-labelledby="delete-branch-title"
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
                    id="delete-branch-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Delete Branch
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Are you sure you want to
                    delete{" "}
                    <span className="font-semibold text-slate-900">
                      {deletingBranch.branchName}
                    </span>
                    ?
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    If this branch is being used
                    by other records, the backend
                    will prevent deletion.
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeletingBranch(null)
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
                onClick={handleDeleteBranch}
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
                  : "Delete Branch"}

              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}

export default Branches;