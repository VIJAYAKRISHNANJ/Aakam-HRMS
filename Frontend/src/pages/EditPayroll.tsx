import { ArrowLeft, CircleDollarSign, Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  getPayrollRun,
  updatePayrollRun,
  type PayrollRun,
  type PayrollStatus,
} from "../services/payrollService";

function EditPayroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState<PayrollStatus>("PENDING");
  const [approvals, setApprovals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!id) {
        setError("Invalid payroll run ID.");
        setLoading(false);
        return;
      }
      void getPayrollRun(id)
        .then((value) => {
          setRun(value);
          setMonth(value.payrollMonth.slice(0, 7));
          setStatus(value.status);
          setApprovals(value.pendingApprovals);
        })
        .catch((requestError) =>
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load payroll run.",
          ),
        )
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!id || !month) return setError("Payroll month is required.");
    if (status === "COMPLETED")
      return setError("Completed payroll runs cannot be edited.");
    try {
      setSaving(true);
      await updatePayrollRun(id, {
        payrollMonth: `${month}-01`,
        status,
        pendingApprovals: approvals,
      });
      navigate(`/payroll/${id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payroll run.",
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
                Edit Payroll Run
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Update an uncompleted payroll run.
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading payroll run...
          </section>
        ) : error && !run ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
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
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
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
                  value={approvals}
                  onChange={(event) => setApprovals(Number(event.target.value))}
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
                to={run ? `/payroll/${run.id}` : "/payroll"}
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
                {saving ? "Saving..." : "Update Payroll Run"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
export default EditPayroll;
