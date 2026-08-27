import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  createBranch,
  getBranches,
  type BranchCompany,
  type CreateBranchPayload,
} from "../services/branchService";

const initialForm: CreateBranchPayload = {
  companyId: 0,
  branchCode: "",
  branchName: "",
  location: "",
  address: "",
  phone: "",
  email: "",
  status: "ACTIVE",
};

function AddBranch() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<CreateBranchPayload>(
      initialForm,
    );

  const [companies, setCompanies] =
    useState<BranchCompany[]>([]);

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Companies
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        setError("");

        const data =
          await getBranches();

        setCompanies(data.companies);
      } catch (requestError) {
        console.error(
          "Failed to load companies:",
          requestError,
        );

        setError(
          "Unable to load companies. Please make sure the backend is running.",
        );
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Handle Input
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
    >,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "companyId"
          ? Number(value)
          : value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    /*
    |--------------------------------------------------------------------------
    | Required Validation
    |--------------------------------------------------------------------------
    */

    if (!form.companyId) {
      setError(
        "Company is required.",
      );
      return;
    }

    if (!form.branchCode.trim()) {
      setError(
        "Branch Code is required.",
      );
      return;
    }

    if (!form.branchName.trim()) {
      setError(
        "Branch Name is required.",
      );
      return;
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email,
      )
    ) {
      setError(
        "Please enter a valid email address.",
      );
      return;
    }

    try {
      setLoading(true);

      await createBranch({
        companyId:
          Number(form.companyId),

        branchCode:
          form.branchCode.trim(),

        branchName:
          form.branchName.trim(),

        location:
          form.location?.trim() || "",

        address:
          form.address?.trim() || "",

        phone:
          form.phone?.trim() || "",

        email:
          form.email?.trim() || "",

        status:
          form.status,
      });

      setSuccess(
        "Branch created successfully.",
      );

      window.setTimeout(() => {
        navigate(
          "/organization/branches",
        );
      }, 700);
    } catch (requestError: any) {
      console.error(
        "Failed to create branch:",
        requestError,
      );

      const message =
        requestError?.response?.data
          ?.message;

      setError(
        message ||
          "Unable to create branch. Please check the details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <Link
              to="/organization/branches"
              className="
                mt-1
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-slate-300
                bg-white
                text-slate-600
                transition
                hover:bg-slate-50
              "
              aria-label="Back to branches"
            >
              <ArrowLeft size={17} />
            </Link>

            <div>

              <div className="flex items-center gap-2">

                <Building2
                  size={20}
                  className="text-teal-700"
                />

                <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                  Add Branch
                </h1>

              </div>

              <p className="mt-1 text-sm text-slate-600">
                Create a new company branch and
                configure its contact information.
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <section className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <CheckCircle2
              size={18}
              className="shrink-0"
            />

            <span>
              {success}
            </span>

          </section>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </section>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border border-slate-300 bg-white"
        >

          {/* =================================================
              BRANCH INFORMATION
          ================================================= */}

          <section>

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-sm font-semibold text-slate-900">
                Branch Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Basic branch and company details.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              {/* Company */}

              <label className="block">

                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Company
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </span>

                <select
                  name="companyId"
                  value={
                    form.companyId || ""
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    loadingCompanies
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
                    disabled:cursor-not-allowed
                    disabled:bg-slate-100
                  "
                >

                  <option value="">
                    {loadingCompanies
                      ? "Loading companies..."
                      : "Select company"}
                  </option>

                  {companies.map(
                    (company) => (
                      <option
                        key={company.id}
                        value={company.id}
                      >
                        {
                          company.displayName
                        }
                      </option>
                    ),
                  )}

                </select>

              </label>

              {/* Branch Code */}

              <Field
                label="Branch Code"
                name="branchCode"
                value={
                  form.branchCode
                }
                onChange={
                  handleChange
                }
                required
                placeholder="CHN001"
              />

              {/* Branch Name */}

              <Field
                label="Branch Name"
                name="branchName"
                value={
                  form.branchName
                }
                onChange={
                  handleChange
                }
                required
                placeholder="Chennai Main Branch"
              />

              {/* Location */}

              <Field
                label="Location"
                name="location"
                value={
                  form.location
                }
                onChange={
                  handleChange
                }
                placeholder="Chennai"
              />

            </div>
          </section>

          {/* =================================================
              CONTACT & ADDRESS
          ================================================= */}

          <section className="border-t border-slate-200">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-sm font-semibold text-slate-900">
                Contact & Address
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Branch contact and address
                information.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              {/* Phone */}

              <Field
                label="Phone"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  handleChange
                }
                placeholder="+91 9876543210"
              />

              {/* Email */}

              <Field
                label="Email"
                name="email"
                type="email"
                value={
                  form.email
                }
                onChange={
                  handleChange
                }
                placeholder="branch@aakam.com"
              />

              {/* Address */}

              <div className="md:col-span-2">

                <label className="block">

                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Address
                  </span>

                  <textarea
                    name="address"
                    value={
                      form.address
                    }
                    onChange={
                      handleChange
                    }
                    rows={4}
                    placeholder="Branch address"
                    className="
                      w-full
                      resize-none
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-3
                      py-2.5
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

                </label>

              </div>

            </div>
          </section>

          {/* =================================================
              STATUS
          ================================================= */}

          <section className="border-t border-slate-200">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-sm font-semibold text-slate-900">
                Branch Configuration
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Configure the current branch
                status.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              <label className="block">

                <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Status
                </span>

                <select
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
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

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                </select>

              </label>

            </div>
          </section>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

            <Link
              to="/organization/branches"
              className="
                inline-flex
                h-10
                items-center
                justify-center
                rounded-lg
                border
                border-slate-300
                bg-white
                px-5
                text-sm
                font-medium
                text-slate-700
                transition
                hover:bg-slate-100
              "
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                loading ||
                loadingCompanies
              }
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

              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Creating..."
                : "Create Branch"}

            </button>

          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| Input Field
|--------------------------------------------------------------------------
*/

function Field({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  value: string | undefined;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-semibold text-slate-700">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </span>

      <input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
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
          placeholder:text-slate-400
          focus:border-teal-600
          focus:ring-2
          focus:ring-teal-600/20
        "
      />

    </label>
  );
}

export default AddBranch;