import { ArrowLeft, CircleDollarSign, Save } from "lucide-react";

import { useState } from "react";

import type { FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  createPayrollRun,
  type PayrollStatus,
} from "../services/payrollService";

function AddPayroll() {
  const navigate = useNavigate();

  const [payrollMonth, setPayrollMonth] = useState("");
  const [status, setStatus] =
    useState<PayrollStatus>("PENDING");

  const [pendingApprovals, setPendingApprovals] =
    useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (!payrollMonth) {
      return setError(
        "Payroll month is required.",
      );
    }

    if (
      !Number.isInteger(pendingApprovals) ||
      pendingApprovals < 0
    ) {
      return setError(
        "Pending approvals must be a non-negative whole number.",
      );
    }

    try {
      setSaving(true);

      await createPayrollRun({
        payrollMonth: `${payrollMonth}-01`,
        status,
        pendingApprovals,
      });

      navigate("/payroll");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create payroll run.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =====================================================
            BACK TO PAYROLL
        ===================================================== */}

        <Link
          to="/payroll"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Payroll"
        >
          <ArrowLeft size={17} />
          Back to Payroll
        </Link>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
            <CircleDollarSign
              size={22}
              className="text-teal-700"
            />
          </div>

          <div>
            <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
              Add Payroll Run
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Create a payroll run for a calendar month.
            </p>
          </div>
        </section>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={submit}
          className="w-full rounded-xl border border-slate-200 bg-white p-6"
        >
          {/* ===================================================
              FORM FIELDS
          =================================================== */}

          <div className="grid gap-5 md:grid-cols-2">

            {/* Payroll Month */}

            <label className="text-sm font-medium text-slate-700">
              Payroll Month

              <input
                type="month"
                required
                value={payrollMonth}
                onChange={(event) =>
                  setPayrollMonth(
                    event.target.value,
                  )
                }
                className="mt-2 block h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </label>

            {/* Status */}

            <label className="text-sm font-medium text-slate-700">
              Status

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as PayrollStatus,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="PROCESSING">
                  Processing
                </option>
              </select>
            </label>

            {/* Pending Approvals */}

            <label className="text-sm font-medium text-slate-700">
              Pending Approvals

              <input
                type="number"
                min="0"
                step="1"
                value={pendingApprovals}
                onChange={(event) =>
                  setPendingApprovals(
                    Number(event.target.value),
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </label>
          </div>

          {/* ===================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ===================================================
              ACTIONS
          =================================================== */}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            {/* Cancel */}

            <Link
              to="/payroll"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            {/* Create */}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Create Payroll Run"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AddPayroll;