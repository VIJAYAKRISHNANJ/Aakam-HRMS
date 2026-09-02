import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  approvePayroll,
  completePayroll,
  getPayrollRun,
  processPayroll,
  type PayrollRun,
  type PayrollStatus,
} from "../services/payrollService";

const labels: Record<PayrollStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};
const badgeClasses: Record<PayrollStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};
const formatMonth = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function PayrollDetails() {
  const { id } = useParams();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const load = useCallback(async () => {
    if (!id) {
      setError("Invalid payroll run ID.");
      setLoading(false);
      return;
    }
    try {
      setRun(await getPayrollRun(id));
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load payroll run.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const action = async (kind: "process" | "approve" | "complete") => {
    if (!id) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const request =
        kind === "process"
          ? processPayroll
          : kind === "approve"
            ? approvePayroll
            : completePayroll;
      await request(id);
      setMessage("Payroll run updated successfully.");
      setConfirmComplete(false);
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payroll run.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <Link
          to="/payroll"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Payroll"
        >
          <ArrowLeft size={17} />
          Back to Payroll
        </Link>
        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading payroll run...
          </section>
        ) : error || !run ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "Payroll run not found."}
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <CircleDollarSign size={22} className="text-teal-700" />
                </div>
                <div>
                  <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                    {formatMonth(run.payrollMonth)}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Payroll run #{run.id}{" "}
                    <span className="mx-1 text-slate-300">•</span>{" "}
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[run.status]}`}
                    >
                      {labels[run.status]}
                    </span>
                  </p>
                </div>
              </div>
              {run.status !== "COMPLETED" && (
                <Link
                  to={`/payroll/edit/${run.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  <Edit size={16} />
                  Edit Payroll
                </Link>
              )}
            </section>
            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Payroll information
                </h2>
                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">Payroll Month</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {formatMonth(run.payrollMonth)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Status</dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[run.status]}`}
                      >
                        {labels[run.status]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">
                      Pending Approvals
                    </dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {run.pendingApprovals}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Created Date</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {formatDate(run.createdAt)}
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Workflow status
                </h2>
                <div className="mt-6 flex items-center justify-between gap-2">
                  {(
                    ["PENDING", "PROCESSING", "COMPLETED"] as PayrollStatus[]
                  ).map((stage, index) => (
                    <div
                      key={stage}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${run.status === stage ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400"}`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`text-xs font-semibold ${run.status === stage ? "text-teal-700" : "text-slate-500"}`}
                      >
                        {labels[stage]}
                      </span>
                      {index < 2 && (
                        <div
                          className={`h-px min-w-3 flex-1 ${run.status === "COMPLETED" || (run.status === "PROCESSING" && index === 0) ? "bg-teal-500" : "bg-slate-200"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {run.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void action("process")}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                    >
                      <Play size={16} />
                      {busy ? "Processing..." : "Process Payroll"}
                    </button>
                  )}
                  {run.status === "PROCESSING" && run.pendingApprovals > 0 && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void action("approve")}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      <ShieldCheck size={16} />
                      {busy ? "Approving..." : "Approve One"}
                    </button>
                  )}
                  {run.status === "PROCESSING" &&
                    run.pendingApprovals === 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmComplete(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} />
                        Complete Payroll
                      </button>
                    )}
                  {run.status === "COMPLETED" && (
                    <span className="text-sm text-emerald-700">
                      This payroll run is complete.
                    </span>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
      {confirmComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy)
              setConfirmComplete(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-payroll-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2
              id="complete-payroll-title"
              className="text-lg font-semibold text-slate-900"
            >
              Complete payroll run?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will mark the{" "}
              {run ? formatMonth(run.payrollMonth) : "payroll"} run as
              completed. Completed runs cannot be edited.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmComplete(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void action("complete")}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Completing..." : "Complete Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
export default PayrollDetails;
