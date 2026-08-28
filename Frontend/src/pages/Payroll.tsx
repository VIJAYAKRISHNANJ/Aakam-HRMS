import {
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Eye,
  Play,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  approvePayroll,
  completePayroll,
  getPayrollRuns,
  processPayroll,
  type PayrollRun,
  type PayrollStatus,
} from "../services/payrollService";

const statusLabel: Record<PayrollStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};
const statusClass: Record<PayrollStatus, string> = {
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

function Payroll() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadRuns = async () => {
    try {
      setError("");
      setRuns(await getPayrollRuns());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load payroll runs.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRuns();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const runAction = async (
    run: PayrollRun,
    action: "process" | "approve" | "complete",
  ) => {
    setBusyId(run.id);
    setError("");
    setActionMessage("");
    try {
      const actionRequest =
        action === "process"
          ? processPayroll
          : action === "approve"
            ? approvePayroll
            : completePayroll;
      await actionRequest(run.id);
      setActionMessage(
        `Payroll for ${formatMonth(run.payrollMonth)} updated successfully.`,
      );
      await loadRuns();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payroll run.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const summary = [
    [
      "Total Payroll Runs",
      runs.length,
      CircleDollarSign,
      "text-teal-700",
      "bg-teal-50",
    ],
    [
      "Pending Payroll",
      runs.filter((run) => run.status === "PENDING").length,
      ShieldCheck,
      "text-amber-700",
      "bg-amber-50",
    ],
    [
      "Processing",
      runs.filter((run) => run.status === "PROCESSING").length,
      Play,
      "text-sky-700",
      "bg-sky-50",
    ],
    [
      "Completed",
      runs.filter((run) => run.status === "COMPLETED").length,
      CheckCircle2,
      "text-emerald-700",
      "bg-emerald-50",
    ],
  ] as const;

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
              <CircleDollarSign size={22} className="text-teal-700" />
            </div>
            <div>
              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Payroll
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage payroll runs, approvals and payroll processing.
              </p>
            </div>
          </div>
          <Link
            to="/payroll/new"
            className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create Payroll Run
          </Link>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(([label, value, Icon, color, background]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{label}</p>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${background}`}
                >
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </section>
        {actionMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading payroll runs...
          </section>
        ) : runs.length === 0 ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">
            <CircleDollarSign
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />
            <h2 className="text-base font-semibold text-slate-900">
              No payroll runs found.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a payroll run to begin processing.
            </p>
          </section>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Payroll Month</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Pending Approvals</th>
                    <th className="px-5 py-3">Created Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatMonth(run.payrollMonth)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[run.status]}`}
                        >
                          {statusLabel[run.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {run.pendingApprovals}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(run.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Link
                            title="View"
                            to={`/payroll/${run.id}`}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                          >
                            <Eye size={16} />
                          </Link>
                          {run.status !== "COMPLETED" && (
                            <Link
                              title="Edit"
                              to={`/payroll/edit/${run.id}`}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                            >
                              <Edit size={16} />
                            </Link>
                          )}
                          {run.status === "PENDING" && (
                            <button
                              title="Process"
                              type="button"
                              disabled={busyId === run.id}
                              onClick={() => void runAction(run, "process")}
                              className="rounded-md p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
                            >
                              <Play size={16} />
                            </button>
                          )}
                          {run.status === "PROCESSING" &&
                            run.pendingApprovals > 0 && (
                              <button
                                title="Approve"
                                type="button"
                                disabled={busyId === run.id}
                                onClick={() => void runAction(run, "approve")}
                                className="rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            )}
                          {run.status === "PROCESSING" &&
                            run.pendingApprovals === 0 && (
                              <button
                                title="Complete"
                                type="button"
                                disabled={busyId === run.id}
                                onClick={() => void runAction(run, "complete")}
                                className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export default Payroll;
