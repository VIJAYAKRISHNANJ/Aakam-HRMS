import {
  ArrowLeft,
  Building2,
  Save,
} from "lucide-react";

import {
  useEffect,
  useRef,
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
  getCompanyById,
  updateCompany,
} from "../services/companyService";

import type {
  CompanyPayload,
} from "../services/companyService";

function EditCompany() {
  const {
    id,
  } = useParams<{
    id: string;
  }>();

  const navigate =
    useNavigate();

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

  const [
    companyCode,
    setCompanyCode,
  ] = useState("");

  const [
    legalName,
    setLegalName,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    registrationNumber,
    setRegistrationNumber,
  ] = useState("");

  const [
    pan,
    setPan,
  ] = useState("");

  const [
    tan,
    setTan,
  ] = useState("");

  const [
    gstin,
    setGstin,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    logoUrl,
    setLogoUrl,
  ] = useState("");

  const [
    financialYearStart,
    setFinancialYearStart,
  ] = useState("");

  const [
    payrollFrequency,
    setPayrollFrequency,
  ] = useState("MONTHLY");

  const [
    status,
    setStatus,
  ] = useState("ACTIVE");

  /*
  |--------------------------------------------------------------------------
  | Financial Year Start Date Input Reference
  |--------------------------------------------------------------------------
  */

  const financialYearStartRef =
    useRef<HTMLInputElement>(null);

  /*
  |--------------------------------------------------------------------------
  | Open Native Calendar
  |--------------------------------------------------------------------------
  */

  const openFinancialYearCalendar =
    () => {
      const input =
        financialYearStartRef.current;

      if (!input) {
        return;
      }

      if (
        typeof input.showPicker ===
        "function"
      ) {
        input.showPicker();
      } else {
        input.focus();
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Convert API date to input date
  |--------------------------------------------------------------------------
  */

  const formatDateForInput = (
    value: string | null,
  ): string => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value.slice(0, 10);
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

  /*
  |--------------------------------------------------------------------------
  | Load Company
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadCompany =
      async () => {
        if (!id) {
          setError(
            "Invalid company ID.",
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const company =
            await getCompanyById(id);

          setCompanyCode(
            company.companyCode,
          );

          setLegalName(
            company.legalName,
          );

          setDisplayName(
            company.displayName || "",
          );

          setRegistrationNumber(
            company.registrationNumber || "",
          );

          setPan(
            company.pan || "",
          );

          setTan(
            company.tan || "",
          );

          setGstin(
            company.gstin || "",
          );

          setEmail(
            company.email || "",
          );

          setPhone(
            company.phone || "",
          );

          setAddress(
            company.address || "",
          );

          setLogoUrl(
            company.logoUrl || "",
          );

          setFinancialYearStart(
            formatDateForInput(
              company.financialYearStart,
            ),
          );

          setPayrollFrequency(
            company.payrollFrequency ||
              "MONTHLY",
          );

          setStatus(
            company.status ||
              "ACTIVE",
          );
        } catch (requestError) {
          console.error(
            "Failed to load company:",
            requestError,
          );

          setError(
            "Unable to load company information. Please make sure the backend is running.",
          );
        } finally {
          setLoading(false);
        }
      };

    loadCompany();
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
        "Invalid company ID.",
      );

      return;
    }

    const trimmedCompanyCode =
      companyCode.trim().toUpperCase();

    const trimmedLegalName =
      legalName.trim();

    if (!trimmedCompanyCode) {
      setError(
        "Company code is required.",
      );

      return;
    }

    if (!trimmedLegalName) {
      setError(
        "Legal name is required.",
      );

      return;
    }

    try {
      setSaving(true);

      const payload: CompanyPayload =
        {
          companyCode:
            trimmedCompanyCode,

          legalName:
            trimmedLegalName,

          displayName:
            displayName.trim(),

          registrationNumber:
            registrationNumber.trim(),

          pan:
            pan.trim().toUpperCase(),

          tan:
            tan.trim().toUpperCase(),

          gstin:
            gstin.trim().toUpperCase(),

          email:
            email.trim(),

          phone:
            phone.trim(),

          address:
            address.trim(),

          logoUrl:
            logoUrl.trim(),

          financialYearStart:
            financialYearStart,

          payrollFrequency:
            payrollFrequency,

          status:
            status,
        };

      await updateCompany(
        id,
        payload,
      );

      navigate(
        "/organization/company",
      );
    } catch (requestError) {
      console.error(
        "Failed to update company:",
        requestError,
      );

      setError(
        "Unable to update company. Please check the entered information and try again.",
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
              CHANGE 2
              BACK BUTTON ABOVE EDIT COMPANY TITLE
          ================================================= */}

          <div className="mb-4">

            <Link
              to="/organization/company"
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
              aria-label="Back to Company"
            >
              <ArrowLeft size={16} />
              Back to Company
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
                Edit Company
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Update the company and legal
                entity information.
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
              Loading company information...
            </p>

          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >

            {/* =================================================
                BASIC INFORMATION
            ================================================= */}

            <section className="rounded-xl border border-slate-300 bg-white">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-base font-semibold text-slate-900">
                  Company Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the basic company and
                  legal entity details.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                <FormField
                  label="Company Code"
                  required
                  htmlFor="company-code"
                >
                  <input
                    id="company-code"
                    type="text"
                    value={companyCode}
                    onChange={(event) =>
                      setCompanyCode(
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="AAKAM001"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Legal Name"
                  required
                  htmlFor="legal-name"
                >
                  <input
                    id="legal-name"
                    type="text"
                    value={legalName}
                    onChange={(event) =>
                      setLegalName(
                        event.target.value,
                      )
                    }
                    placeholder="Aakam Technologies Private Limited"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Display Name"
                  htmlFor="display-name"
                >
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(event) =>
                      setDisplayName(
                        event.target.value,
                      )
                    }
                    placeholder="Aakam HRMS Technologies"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Registration Number"
                  htmlFor="registration-number"
                >
                  <input
                    id="registration-number"
                    type="text"
                    value={registrationNumber}
                    onChange={(event) =>
                      setRegistrationNumber(
                        event.target.value,
                      )
                    }
                    placeholder="U62010TN2024PTC000001"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

              </div>

            </section>

            {/* =================================================
                TAX INFORMATION
            ================================================= */}

            <section className="rounded-xl border border-slate-300 bg-white">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-base font-semibold text-slate-900">
                  Tax & Registration
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update PAN, TAN, and GST registration
                  details.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">

                <FormField
                  label="PAN"
                  htmlFor="pan"
                >
                  <input
                    id="pan"
                    type="text"
                    value={pan}
                    onChange={(event) =>
                      setPan(
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="TAN"
                  htmlFor="tan"
                >
                  <input
                    id="tan"
                    type="text"
                    value={tan}
                    onChange={(event) =>
                      setTan(
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="CHEA12345B"
                    maxLength={10}
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="GSTIN"
                  htmlFor="gstin"
                >
                  <input
                    id="gstin"
                    type="text"
                    value={gstin}
                    onChange={(event) =>
                      setGstin(
                        event.target.value.toUpperCase(),
                      )
                    }
                    placeholder="33ABCDE1234F1Z5"
                    maxLength={15}
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

              </div>

            </section>

            {/* =================================================
                CONTACT
            ================================================= */}

            <section className="rounded-xl border border-slate-300 bg-white">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-base font-semibold text-slate-900">
                  Contact Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update company contact and address
                  information.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                <FormField
                  label="Email"
                  htmlFor="email"
                >
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    placeholder="admin@aakam.com"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Phone"
                  htmlFor="phone"
                >
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value,
                      )
                    }
                    placeholder="+91 9876543210"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

                <FormField
                  label="Address"
                  htmlFor="address"
                >
                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(
                        event.target.value,
                      )
                    }
                    placeholder="Chennai, Tamil Nadu, India"
                    rows={3}
                    disabled={saving}
                    className="
                      w-full
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
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                    "
                  />
                </FormField>

                <FormField
                  label="Logo URL"
                  htmlFor="logo-url"
                >
                  <input
                    id="logo-url"
                    type="url"
                    value={logoUrl}
                    onChange={(event) =>
                      setLogoUrl(
                        event.target.value,
                      )
                    }
                    placeholder="https://example.com/logo.png"
                    disabled={saving}
                    className={inputClassName}
                  />
                </FormField>

              </div>

            </section>

            {/* =================================================
                FINANCIAL / PAYROLL
            ================================================= */}

            <section className="rounded-xl border border-slate-300 bg-white">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-base font-semibold text-slate-900">
                  Financial & Payroll
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure financial year, payroll
                  frequency, and company status.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">

                <FormField
                  label="Financial Year Start"
                  htmlFor="financial-year-start"
                >
                  <div
                    className="relative cursor-pointer"
                    onClick={
                      openFinancialYearCalendar
                    }
                  >
                    <input
                      ref={
                        financialYearStartRef
                      }
                      id="financial-year-start"
                      type="date"
                      value={
                        financialYearStart
                      }
                      onChange={(event) =>
                        setFinancialYearStart(
                          event.target.value,
                        )
                      }
                      disabled={saving}
                      className={`
                        ${inputClassName}
                        cursor-pointer
                      `}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Payroll Frequency"
                  htmlFor="payroll-frequency"
                >
                  <select
                    id="payroll-frequency"
                    value={
                      payrollFrequency
                    }
                    onChange={(event) =>
                      setPayrollFrequency(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    className={inputClassName}
                  >
                    <option value="MONTHLY">
                      Monthly
                    </option>

                    <option value="WEEKLY">
                      Weekly
                    </option>

                    <option value="BIWEEKLY">
                      Biweekly
                    </option>

                    <option value="QUARTERLY">
                      Quarterly
                    </option>

                    <option value="YEARLY">
                      Yearly
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Status"
                  htmlFor="status"
                >
                  <select
                    id="status"
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value,
                      )
                    }
                    disabled={saving}
                    className={inputClassName}
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </FormField>

              </div>

            </section>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">

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
        )}

      </div>

    </DashboardLayout>
  );
}

/*
|--------------------------------------------------------------------------
| Reusable Form Field
|--------------------------------------------------------------------------
*/

function FormField({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>

      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}

    </div>
  );
}

const inputClassName = `
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
`;

export default EditCompany;