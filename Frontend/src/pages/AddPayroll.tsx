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
  const [status, setStatus] = useState<PayrollStatus>("PENDING");
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!payrollMonth) return setError("Payroll month is required.");
    if (!Number.isInteger(pendingApprovals) || pendingApprovals < 0)
      return setError("Pending approvals must be a non-negative whole number.");
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            to="/payroll"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back to payroll"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-3">
            <CircleDollarSign size={22} className="text-teal-700" />
            <div>
              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Add Payroll Run
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Create a payroll run for a calendar month.
              </p>
            </div>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-200 bg-white p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Payroll Month
              <input
                type="month"
                required
                value={payrollMonth}
                onChange={(event) => setPayrollMonth(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PayrollStatus)
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Pending Approvals
              <input
                type="number"
                min="0"
                step="1"
                value={pendingApprovals}
                onChange={(event) =>
                  setPendingApprovals(Number(event.target.value))
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
              />
            </label>
          </div>
          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="mt-7 flex justify-end gap-3">
            <Link
              to="/payroll"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Create Payroll Run"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
export default AddPayroll;
