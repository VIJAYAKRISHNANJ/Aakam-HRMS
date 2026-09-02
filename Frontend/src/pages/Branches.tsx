import {
  Building2,
  Edit,
  MapPin,
  Mail,
  Phone,
  Plus,
  Search,
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

import {
  getBranches,
  type Branch,
} from "../services/branchService";

function Branches() {
  const navigate = useNavigate();

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [search, setSearch] =
    useState("");

  const [companyId, setCompanyId] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [companies, setCompanies] =
    useState<
      {
        id: number;
        companyCode: string;
        displayName: string;
        legalName: string;
      }[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Branches
  |--------------------------------------------------------------------------
  */

  const loadBranches = async () => {
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

              <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-3 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_80px] md:gap-4">

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
                        md:grid-cols-[1.4fr_1fr_1fr_1fr_120px_80px]
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

                      {/* Edit */}

                      <div
                        className="flex justify-start md:justify-end"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                        onKeyDown={(event) =>
                          event.stopPropagation()
                        }
                      >

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

                      </div>

                    </div>
                  ),
                )}

              </div>

            </section>
          )}

      </div>

    </DashboardLayout>
  );
}

export default Branches;