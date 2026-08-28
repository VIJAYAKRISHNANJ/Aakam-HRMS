import { Edit, Eye, Plus, Trash2, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  PageHeader,
  SearchInput,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";
import {
  deleteOnboarding,
  getOnboardingErrorMessage,
  getOnboardings,
  onboardingStatuses,
  type OnboardingRecord,
} from "../services/onboardingService";

const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
const statusClass = (status: string) =>
  status === "COMPLETED"
    ? "bg-emerald-100 text-emerald-700"
    : status === "CANCELLED"
      ? "bg-rose-100 text-rose-700"
      : "bg-teal-100 text-teal-700";

function Progress({ completed, total }: { completed: number; total: number }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>
          {completed}/{total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-600"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function Onboarding() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OnboardingRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setRecords(await getOnboardings({ search, status }));
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          "Unable to load onboarding records.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void load();
      },
      search ? 300 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [load, search]);

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteOnboarding(deleteTarget.id);
      setRecords((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setSuccess("Onboarding record deleted successfully.");
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          "Unable to delete onboarding record.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Onboarding"
          subtitle="Move selected candidates from offer acceptance to a completed employee setup."
          icon={UserRound}
          action={
            <Link
              to="/onboarding/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} />
              Add Onboarding
            </Link>
          }
        />
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search candidate, code, or job..."
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
            >
              <option value="">All statuses</option>
              {onboardingStatuses.map((item) => (
                <option key={item} value={item}>
                  {label(item)}
                </option>
              ))}
            </select>
          </div>
        </section>
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
        {loading ? (
          <StateMessage type="loading">
            Loading onboarding records...
          </StateMessage>
        ) : error ? (
          <StateMessage type="error">{error}</StateMessage>
        ) : records.length === 0 ? (
          <StateMessage type="empty">No onboarding records found.</StateMessage>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Candidate",
                      "Onboarding ID",
                      "Department",
                      "Joining Date",
                      "Status",
                      "Documents",
                      "Checklist",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} className="px-5 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {record.candidateName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {record.candidateEmail}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {record.onboardingCode}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {record.department}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {date(record.expectedJoiningDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(record.status)}`}
                        >
                          {label(record.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Progress {...record.documentProgress} />
                      </td>
                      <td className="px-5 py-4">
                        <Progress {...record.checklistProgress} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <Link
                            title="View"
                            to={`/onboarding/${record.id}`}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            title="Edit"
                            to={`/onboarding/edit/${record.id}`}
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteTarget(record)}
                            className="rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 size={16} />
                          </button>
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
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete onboarding record?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {deleteTarget.onboardingCode} for {deleteTarget.candidateName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-5 text-sm text-slate-600">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                {deleting ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
export default Onboarding;
