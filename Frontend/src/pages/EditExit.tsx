import { ArrowLeft, Edit, Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";
import {
  getExit,
  getExitErrorMessage,
  updateExit,
  type ExitRecord,
} from "../services/exitsService";

function EditExit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ExitRecord | null>(null);
  const [resignationDate, setResignationDate] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [lastWorkingDate, setLastWorkingDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    getExit(id)
      .then((data) => {
        setRecord(data);
        setResignationDate(data.resignationDate);
        setExitReason(data.exitReason);
        setNoticePeriod(String(data.noticePeriod));
        setLastWorkingDate(data.lastWorkingDate);
        setRemarks(data.remarks ?? "");
      })
      .catch((requestError) =>
        setError(
          getExitErrorMessage(requestError, "Unable to load this exit record."),
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !record) return;
    const notice = Number(noticePeriod);
    if (
      !resignationDate ||
      !exitReason.trim() ||
      !lastWorkingDate ||
      !Number.isInteger(notice) ||
      notice < 0
    )
      return setError(
        "Enter valid exit details and a non-negative notice period.",
      );
    if (lastWorkingDate < resignationDate)
      return setError("Last working date cannot be before resignation date.");
    try {
      setSaving(true);
      setError("");
      await updateExit(id, {
        resignationDate,
        exitReason: exitReason.trim(),
        noticePeriod: notice,
        lastWorkingDate,
        remarks: remarks.trim() || null,
      });
      navigate(`/exits/${id}`);
    } catch (requestError) {
      setError(
        getExitErrorMessage(requestError, "Failed to update exit record."),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Edit Exit"
          subtitle={
            record
              ? `${record.employeeName} · Update exit record.`
              : "Update exit record."
          }
          icon={Edit}
        />
        <Link
          to={id ? `/exits/${id}` : "/exits"}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Exit"
        >
          <ArrowLeft size={17} />
          Back to Exit
        </Link>
        {loading ? (
          <StateMessage type="loading">Loading exit record...</StateMessage>
        ) : error && !record ? (
          <StateMessage type="error">{error}</StateMessage>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 className="font-semibold text-slate-900">Exit information</h2>
            <p className="mt-1 text-sm text-slate-500">
              Workflow status and approval are managed from the exit details
              page.
            </p>
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Resignation date
                <input
                  required
                  type="date"
                  value={resignationDate}
                  onChange={(event) => setResignationDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Exit reason
                <input
                  required
                  value={exitReason}
                  onChange={(event) => setExitReason(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Notice period (days)
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={noticePeriod}
                  onChange={(event) => setNoticePeriod(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Last working date
                <input
                  required
                  type="date"
                  value={lastWorkingDate}
                  onChange={(event) => setLastWorkingDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Remarks
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-teal-600"
                />
              </label>
            </div>
            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
export default EditExit;
