import {
  ArrowLeft,
  Check,
  Edit,
  FileText,
  LogOut,
  Save,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";
import {
  checklistStatuses,
  documentStatuses,
  getExit,
  getExitChecklist,
  getExitDocuments,
  getExitErrorMessage,
  getExitSettlement,
  settlementStatuses,
  updateExit,
  updateExitChecklist,
  updateExitDocument,
  updateExitSettlement,
  type ApprovalStatus,
  type ChecklistStatus,
  type DocumentStatus,
  type ExitChecklistItem,
  type ExitDocument,
  type ExitRecord,
  type ExitSettlement,
  type ExitStatus,
  type SettlementStatus,
} from "../services/exitsService";

const workflow = [
  "RESIGNATION_SUBMITTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "NOTICE_PERIOD",
  "CLEARANCE",
  "SETTLEMENT",
  "DOCUMENTS",
  "COMPLETED",
] as const;
const format = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = (value: string | null) =>
  value
    ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "-";
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value,
  );
const statusClass = (value: string) =>
  value === "COMPLETED" || value === "APPROVED" || value === "ISSUED"
    ? "bg-emerald-100 text-emerald-700"
    : value === "CANCELLED" || value === "REJECTED"
      ? "bg-rose-100 text-rose-700"
      : value === "CLEARANCE" || value === "SETTLEMENT"
        ? "bg-amber-100 text-amber-700"
        : "bg-sky-100 text-sky-700";

function ExitDetails() {
  const { id } = useParams();
  const [record, setRecord] = useState<ExitRecord | null>(null);
  const [checklist, setChecklist] = useState<ExitChecklistItem[]>([]);
  const [settlement, setSettlement] = useState<ExitSettlement | null>(null);
  const [documents, setDocuments] = useState<ExitDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState<ExitStatus | null>(null);
  const [settlementDraft, setSettlementDraft] = useState<ExitSettlement | null>(
    null,
  );
  const [editingSettlement, setEditingSettlement] = useState(false);
  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const [exit, items, settlementData, documentData] = await Promise.all([
        getExit(id),
        getExitChecklist(id),
        getExitSettlement(id),
        getExitDocuments(id),
      ]);
      setRecord(exit);
      setChecklist(items);
      setSettlement(settlementData);
      setDocuments(documentData);
    } catch (requestError) {
      setError(
        getExitErrorMessage(requestError, "Unable to load this exit record."),
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
  const run = async (name: string, request: () => Promise<unknown>) => {
    try {
      setBusy(name);
      setError("");
      setSuccess("");
      await request();
      setSuccess("Exit information updated successfully.");
      await load();
    } catch (requestError) {
      setError(
        getExitErrorMessage(requestError, "Unable to update exit information."),
      );
    } finally {
      setBusy("");
    }
  };
  const moveWorkflow = (next: ExitStatus) => {
    if (!id || !record) return;
    setConfirm(null);
    void run("workflow", () => updateExit(id, { exitStatus: next }));
  };
  const approvalAction = (approval: ApprovalStatus) => {
    if (!id) return;
    setConfirm(null);
    void run("approval", () => updateExit(id, { approvalStatus: approval }));
  };
  const updateChecklist = (
    item: ExitChecklistItem,
    status: ChecklistStatus,
  ) => {
    if (!id) return;
    void run(`checklist-${item.id}`, () =>
      updateExitChecklist(id, item.id, {
        status,
        completedDate:
          status === "COMPLETED" ? new Date().toISOString().slice(0, 10) : null,
      }),
    );
  };
  const saveSettlement = async () => {
    if (!id || !settlementDraft) return;
    if (settlementDraft.netSettlement > settlementDraft.payableAmount)
      return setError("Net settlement cannot exceed payable amount.");
    await run("settlement", () =>
      updateExitSettlement(id, {
        status: settlementDraft.status as SettlementStatus,
        settlementDate: settlementDraft.settlementDate,
        payableAmount: settlementDraft.payableAmount,
        deductions: settlementDraft.deductions,
        netSettlement: settlementDraft.netSettlement,
        remarks: settlementDraft.remarks,
      }),
    );
    setEditingSettlement(false);
  };
  const editSettlement = () => {
    if (settlement) {
      setSettlementDraft({ ...settlement });
      setEditingSettlement(true);
    }
  };
  const updateDocument = (document: ExitDocument, status: DocumentStatus) => {
    if (!id) return;
    void run(`document-${document.id}`, () =>
      updateExitDocument(id, document.id, { status }),
    );
  };
  if (loading)
    return (
      <DashboardLayout>
        <StateMessage type="loading">Loading exit details...</StateMessage>
      </DashboardLayout>
    );
  if (error && !record)
    return (
      <DashboardLayout>
        <StateMessage type="error">{error}</StateMessage>
      </DashboardLayout>
    );
  if (!record || !id) return null;
  const currentIndex = workflow.indexOf(
    record.exitStatus as (typeof workflow)[number],
  );
  const nextStatus = currentIndex >= 0 ? workflow[currentIndex + 1] : undefined;
  const completed = checklist.filter(
    (item) => item.status === "COMPLETED" || item.status === "NOT_APPLICABLE",
  ).length;
  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/exits"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Back to Exits"
          >
            <ArrowLeft size={17} />
            Back to Exits
          </Link>
          {record.exitStatus !== "COMPLETED" &&
            record.exitStatus !== "CANCELLED" && (
              <Link
                to={`/exits/edit/${id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Edit size={16} />
                Edit
              </Link>
            )}
        </div>
        <PageHeader
          title={record.employeeName}
          subtitle={`${record.employeeCode} · ${record.department}`}
          icon={LogOut}
        />
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Exit workflow</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(record.exitStatus)}`}
            >
              {format(record.exitStatus)}
            </span>
          </div>
          {record.exitStatus === "CANCELLED" ? (
            <div className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              This exit has been cancelled.
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {workflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-2 lg:block">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${index <= currentIndex ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200 text-slate-400"}`}
                    >
                      {index < currentIndex ? <Check size={15} /> : index + 1}
                    </div>
                    <p
                      className={`mt-2 text-xs ${index === currentIndex ? "font-semibold text-teal-700" : "text-slate-500"}`}
                    >
                      {format(step)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {record.exitStatus === "RESIGNATION_SUBMITTED" && (
                  <button
                    type="button"
                    onClick={() => moveWorkflow("PENDING_APPROVAL")}
                    className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Submit for approval
                  </button>
                )}
                {record.exitStatus === "PENDING_APPROVAL" && (
                  <>
                    <button
                      type="button"
                      onClick={() => approvalAction("APPROVED")}
                      className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Approve exit
                    </button>
                    <button
                      type="button"
                      onClick={() => approvalAction("REJECTED")}
                      className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                {nextStatus && record.exitStatus !== "PENDING_APPROVAL" && (
                  <button
                    type="button"
                    onClick={() => setConfirm(nextStatus)}
                    className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Move to {format(nextStatus)}
                  </button>
                )}
              </div>
            </>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">
            Employee and resignation
          </h2>
          <dl className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Employee", record.employeeName],
              ["Employee code", record.employeeCode],
              ["Department", record.department],
              ["Resignation date", date(record.resignationDate)],
              ["Last working date", date(record.lastWorkingDate)],
              ["Exit reason", record.exitReason],
              ["Notice period", `${record.noticePeriod} days`],
              ["Approval status", format(record.approvalStatus)],
              ["Remarks", record.remarks ?? "-"],
              ["Created", date(record.createdAt)],
              ["Updated", date(record.updatedAt)],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-xs text-slate-500">{term}</dt>
                <dd className="mt-1 font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck size={18} className="text-teal-700" />
                Clearance checklist
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completed {completed} / {checklist.length} (
                {checklist.length
                  ? Math.round((completed / checklist.length) * 100)
                  : 0}
                %)
              </p>
            </div>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {checklist.length === 0 ? (
              <p className="py-5 text-center text-sm text-slate-500">
                No checklist items found.
              </p>
            ) : (
              checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {format(item.itemType)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Owner: {item.owner ?? "-"} · Completed:{" "}
                      {date(item.completedDate)} ·{" "}
                      {item.remarks ?? "No remarks"}
                    </p>
                  </div>
                  <select
                    value={item.status}
                    disabled={busy === `checklist-${item.id}`}
                    onChange={(event) =>
                      updateChecklist(
                        item,
                        event.target.value as ChecklistStatus,
                      )
                    }
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}
                  >
                    {checklistStatuses.map((itemStatus) => (
                      <option key={itemStatus} value={itemStatus}>
                        {format(itemStatus)}
                      </option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <WalletCards size={18} className="text-teal-700" />
              Full &amp; final settlement
            </h2>
            {settlement && !editingSettlement && (
              <button
                type="button"
                onClick={editSettlement}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <Edit size={14} />
                Edit
              </button>
            )}
          </div>
          {!settlement ? (
            <p className="mt-5 text-sm text-slate-500">
              No settlement record found.
            </p>
          ) : editingSettlement && settlementDraft ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs text-slate-500">
                Status
                <select
                  value={settlementDraft.status}
                  onChange={(event) =>
                    setSettlementDraft({
                      ...settlementDraft,
                      status: event.target.value as SettlementStatus,
                    })
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {settlementStatuses.map((item) => (
                    <option key={item} value={item}>
                      {format(item)}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["Settlement date", "settlementDate"],
                ["Payable amount", "payableAmount"],
                ["Deductions", "deductions"],
                ["Net settlement", "netSettlement"],
                ["Remarks", "remarks"],
              ].map(([title, key]) => (
                <label key={key} className="text-xs text-slate-500">
                  {title}
                  <input
                    type={
                      key.includes("Amount") ||
                      key === "deductions" ||
                      key === "netSettlement"
                        ? "number"
                        : key === "settlementDate"
                          ? "date"
                          : "text"
                    }
                    value={String(
                      settlementDraft[key as keyof ExitSettlement] ?? "",
                    )}
                    onChange={(event) =>
                      setSettlementDraft({
                        ...settlementDraft,
                        [key]:
                          key.includes("Amount") ||
                          key === "deductions" ||
                          key === "netSettlement"
                            ? Number(event.target.value)
                            : event.target.value,
                      })
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </label>
              ))}
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  disabled={busy === "settlement"}
                  onClick={() => void saveSettlement()}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Save size={15} />
                  {busy === "settlement" ? "Saving..." : "Save settlement"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSettlement(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Status", format(settlement.status)],
                ["Settlement date", date(settlement.settlementDate)],
                ["Payable", money(settlement.payableAmount)],
                ["Deductions", money(settlement.deductions)],
                ["Net settlement", money(settlement.netSettlement)],
                ["Remarks", settlement.remarks ?? "-"],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-xs text-slate-500">{term}</dt>
                  <dd className="mt-1 font-medium text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <FileText size={18} className="text-teal-700" />
            Exit documents
          </h2>
          {documents.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No exit documents found.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {format(document.documentType)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Date: {date(document.documentDate)} · Reference:{" "}
                        {document.reference ?? "-"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {document.remarks ?? "No remarks"}
                      </p>
                    </div>
                    <select
                      value={document.status}
                      disabled={busy === `document-${document.id}`}
                      onChange={(event) =>
                        updateDocument(
                          document,
                          event.target.value as DocumentStatus,
                        )
                      }
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${statusClass(document.status)}`}
                    >
                      {documentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {format(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {confirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Move exit to {format(confirm)}?
                </h2>
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                This workflow change will be sent to the backend for validation.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => moveWorkflow(confirm)}
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {busy ? "Updating..." : "Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export default ExitDetails;
