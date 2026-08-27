import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import {
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
  createCompany,
  type CompanyPayload,
} from "../services/companyService";

const initialForm: CompanyPayload = {
  companyCode: "",
  legalName: "",
  displayName: "",
  registrationNumber: "",
  pan: "",
  tan: "",
  gstin: "",
  email: "",
  phone: "",
  address: "",
  logoUrl: "",
  financialYearStart: "",
  payrollFrequency: "MONTHLY",
  status: "ACTIVE",
};

function AddCompany() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<CompanyPayload>(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Form Change
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
      [name]: value,
    }));

    if (error) {
      setError("");
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
    | Validation
    |--------------------------------------------------------------------------
    */

    if (!form.companyCode.trim()) {
      setError(
        "Company Code is required.",
      );
      return;
    }

    if (!form.legalName.trim()) {
      setError(
        "Legal Name is required.",
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

      await createCompany({
        ...form,

        companyCode:
          form.companyCode.trim(),

        legalName:
          form.legalName.trim(),

        displayName:
          form.displayName?.trim() || "",

        registrationNumber:
          form.registrationNumber?.trim() ||
          "",

        pan:
          form.pan?.trim() || "",

        tan:
          form.tan?.trim() || "",

        gstin:
          form.gstin?.trim() || "",

        email:
          form.email?.trim() || "",

        phone:
          form.phone?.trim() || "",

        address:
          form.address?.trim() || "",

        logoUrl:
          form.logoUrl?.trim() || "",
      });

      setSuccess(
        "Company created successfully.",
      );

      window.setTimeout(() => {
        navigate(
          "/organization/company",
        );
      }, 700);
    } catch (requestError: any) {
      console.error(
        "Failed to create company:",
        requestError,
      );

      const message =
        requestError?.response?.data
          ?.message;

      setError(
        message ||
          "Unable to create company. Please check the details and try again.",
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
              to="/organization/company"
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
              aria-label="Back to company"
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
                  Add Company
                </h1>

              </div>

              <p className="mt-1 text-sm text-slate-600">
                Create a new company and
                configure its HR information.
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
              COMPANY INFORMATION
          ================================================= */}

          <section>

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-sm font-semibold text-slate-900">
                Company Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Basic legal and organization
                information.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

              <Field
                label="Company Code"
                name="companyCode"
                value={
                  form.companyCode
                }
                onChange={
                  handleChange
                }
                required
                placeholder="AAKAM001"
              />

              <Field
                label="Legal Name"
                name="legalName"
                value={
                  form.legalName
                }
                onChange={
                  handleChange
                }
                required
                placeholder="Aakam Technologies Private Limited"
              />

              <Field
                label="Display Name"
                name="displayName"
                value={
                  form.displayName
                }
                onChange={
                  handleChange
                }
                placeholder="Aakam Technologies"
              />

              <Field
                label="Registration Number"
                name="registrationNumber"
                value={
                  form.registrationNumber
                }
                onChange={
                  handleChange
                }
                placeholder="Registration number"
              />

              <Field
                label="PAN"
                name="pan"
                value={form.pan}
                onChange={
                  handleChange
                }
                placeholder="ABCDE1234F"
              />

              <Field
                label="TAN"
                name="tan"
                value={form.tan}
                onChange={
                  handleChange
                }
                placeholder="CHEA12345B"
              />

              <Field
                label="GSTIN"
                name="gstin"
                value={form.gstin}
                onChange={
                  handleChange
                }
                placeholder="33ABCDE1234F1Z5"
              />

            </div>
          </section>

          {/* =================================================
              CONTACT
          ================================================= */}

          <section className="border-t border-slate-200">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-sm font-semibold text-slate-900">
                Contact & Address
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Contact information for the
                organization.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

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
                placeholder="admin@company.com"
              />

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
                    placeholder="Company address"
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
              HR CONFIGURATION
          ================================================= */}

          <section className="border-t border-slate-200">

            <div className="border-b border-slate-200 px-6 py-5">

              <h2 className="text-sm font-semibold text-slate-900">
                HR Configuration
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Configure payroll and company
                status.
              </p>

            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">

              <Field
                label="Financial Year Start"
                name="financialYearStart"
                type="date"
                value={
                  form.financialYearStart
                }
                onChange={
                  handleChange
                }
              />

              <SelectField
                label="Payroll Frequency"
                name="payrollFrequency"
                value={
                  form.payrollFrequency
                }
                onChange={
                  handleChange
                }
                options={[
                  {
                    value: "MONTHLY",
                    label: "Monthly",
                  },
                  {
                    value: "WEEKLY",
                    label: "Weekly",
                  },
                  {
                    value: "BIWEEKLY",
                    label: "Bi-weekly",
                  },
                ]}
              />

              <SelectField
                label="Status"
                name="status"
                value={
                  form.status
                }
                onChange={
                  handleChange
                }
                options={[
                  {
                    value: "ACTIVE",
                    label: "Active",
                  },
                  {
                    value: "INACTIVE",
                    label: "Inactive",
                  },
                ]}
              />

            </div>
          </section>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

            <Link
              to="/organization/company"
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
              disabled={loading}
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
                : "Create Company"}

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

/*
|--------------------------------------------------------------------------
| Select Field
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
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

        {options.map(
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

    </label>
  );
}

export default AddCompany;