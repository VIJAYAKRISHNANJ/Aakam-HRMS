import {
  Building2,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import OrganizationNav from "../components/organization/OrganizationNav";

import {
  getCompanies,
  type Company as CompanyType,
} from "../services/companyService";

const formatDate = (
  value: string | null,
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

const formatLabel = (
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

function Company() {
  const [
    companies,
    setCompanies,
  ] = useState<CompanyType[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const loadCompanies =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getCompanies();

          setCompanies(data);
        } catch (requestError) {
          console.error(
            "Failed to load companies:",
            requestError,
          );

          setError(
            "Unable to load company information. Please make sure the backend is running.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadCompanies();
  }, []);

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
                Companies
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Manage your organization
                companies and legal entities.
              </p>

            </div>

          </div>

          <Link
            to="/organization/company/new"
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
            Add Company
          </Link>

        </section>

        {/* =================================================
            ORGANIZATION NAVIGATION
        ================================================= */}

        <OrganizationNav />

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">

            <Building2
              size={24}
              className="mx-auto mb-3 animate-pulse text-slate-400"
            />

            <p className="text-sm text-slate-500">
              Loading companies...
            </p>

          </section>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && error && (
          <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          companies.length === 0 && (
            <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">

              <Building2
                size={32}
                className="mx-auto mb-3 text-slate-400"
              />

              <h2 className="text-base font-semibold text-slate-900">
                No companies found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create your first company to
                get started.
              </p>

              <Link
                to="/organization/company/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus size={16} />
                Add Company
              </Link>

            </section>
          )}

        {/* =================================================
            COMPANY LIST
        ================================================= */}

        {!loading &&
          !error &&
          companies.length > 0 && (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

              {companies.map(
                (company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                  />
                ),
              )}

            </div>
          )}

      </div>

    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| Company Card
|--------------------------------------------------------------------------
*/

function CompanyCard({
  company,
}: {
  company: CompanyType;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">

      <div className="border-b border-slate-200 p-6">

        <div className="flex items-start justify-between gap-4">

          <div className="flex min-w-0 items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-50">

              <Building2
                size={26}
                className="text-teal-700"
              />

            </div>

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="truncate text-lg font-semibold text-slate-900">
                  {company.displayName ||
                    company.legalName}
                </h2>

                <span
                  className={`
                    rounded-full
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    ${
                      company.status ===
                      "ACTIVE"
                        ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border border-slate-200 bg-slate-100 text-slate-600"
                    }
                  `}
                >
                  {formatLabel(
                    company.status,
                  )}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                {company.legalName}
              </p>

              <p className="mt-2 font-mono text-xs text-slate-500">
                {company.companyCode}
              </p>

            </div>

          </div>

          <Link
            to={`/organization/company/edit/${company.id}`}
            className="
              inline-flex
              shrink-0
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

      <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">

        <InfoItem
          label="Registration Number"
          value={
            company.registrationNumber
          }
        />

        <InfoItem
          label="GSTIN"
          value={company.gstin}
        />

        <InfoItem
          label="PAN"
          value={company.pan}
        />

        <InfoItem
          label="TAN"
          value={company.tan}
        />

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">

            <Mail
              size={16}
              className="text-slate-600"
            />

          </div>

          <div className="min-w-0">

            <p className="text-xs font-medium text-slate-500">
              Email
            </p>

            <p className="mt-1 truncate text-sm font-medium text-slate-800">
              {company.email || "-"}
            </p>

          </div>

        </div>

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">

            <Phone
              size={16}
              className="text-slate-600"
            />

          </div>

          <div>

            <p className="text-xs font-medium text-slate-500">
              Phone
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {company.phone || "-"}
            </p>

          </div>

        </div>

        <div className="flex items-start gap-3 sm:col-span-2">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">

            <MapPin
              size={16}
              className="text-slate-600"
            />

          </div>

          <div>

            <p className="text-xs font-medium text-slate-500">
              Address
            </p>

            <p className="mt-1 text-sm font-medium text-slate-800">
              {company.address || "-"}
            </p>

          </div>

        </div>

      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="text-xs text-slate-500">
            Payroll Frequency
          </p>

          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatLabel(
              company.payrollFrequency,
            )}
          </p>

        </div>

        <div>

          <p className="text-xs text-slate-500">
            Financial Year Start
          </p>

          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatDate(
              company.financialYearStart,
            )}
          </p>

        </div>

        <div>

          <p className="text-xs text-slate-500">
            Created
          </p>

          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatDate(
              company.createdAt,
            )}
          </p>

        </div>

      </div>

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Info Item
|--------------------------------------------------------------------------
*/

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>

      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">
        {value || "-"}
      </p>

    </div>
  );
}

export default Company;