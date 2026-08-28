import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Search,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  Candidate,
  CandidateStage,
  JobPosition,
  JobStatus,
} from "../../services/recruitmentService.ts";

export const stages: CandidateStage[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "SELECTED",
  "HIRED",
  "REJECTED",
];
export const stageLabels: Record<CandidateStage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  HIRED: "Hired",
  REJECTED: "Rejected",
};
const stageStyles: Record<CandidateStage, string> = {
  APPLIED: "bg-slate-100 text-slate-700",
  SCREENING: "bg-sky-100 text-sky-700",
  INTERVIEW: "bg-amber-100 text-amber-700",
  SELECTED: "bg-emerald-100 text-emerald-700",
  HIRED: "bg-teal-100 text-teal-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export function StageBadge({ stage }: { stage: CandidateStage | string }) {
  const label =
    stageLabels[stage as CandidateStage] ?? stage.replaceAll("_", " ");
  const className =
    stageStyles[stage as CandidateStage] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}
export function PageHeader({
  title,
  subtitle,
  icon: Icon = BriefcaseBusiness,
  action,
}: {
  title: string;
  subtitle: string;
  icon?: typeof BriefcaseBusiness;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
          <Icon size={22} className="text-teal-700" />
        </div>
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
      {action}
    </section>
  );
}
export function StateMessage({
  type,
  children,
}: {
  type: "loading" | "error" | "empty";
  children: React.ReactNode;
}) {
  const Icon =
    type === "loading"
      ? Loader2
      : type === "error"
        ? CircleAlert
        : CheckCircle2;
  return (
    <div
      className={`flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border bg-white px-5 text-center text-sm ${type === "error" ? "border-red-200 text-red-700" : "border-slate-200 text-slate-500"}`}
    >
      <Icon size={20} className={type === "loading" ? "animate-spin" : ""} />
      {children}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
      />
    </div>
  );
}
export function JobMiniCard({ job }: { job: JobPosition }) {
  return (
    <Link
      to={`/recruitment/jobs/${job.id}`}
      className="group flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">{job.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {job.department} <span className="mx-1 text-slate-300">•</span>{" "}
          {job.openings} {job.openings === 1 ? "opening" : "openings"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={job.status} />
        <ArrowRight
          size={15}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600"
        />
      </div>
    </Link>
  );
}
export function CandidateCompactCard({
  candidate,
  onStageChange,
}: {
  candidate: Candidate;
  onStageChange: (stage: CandidateStage) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <Link
        to={`/recruitment/candidates/${candidate.id}`}
        className="flex items-start gap-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <UserRound size={15} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {candidate.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {candidate.jobPosition}
          </p>
        </div>
      </Link>
      <select
        value={candidate.stage}
        onChange={(event) =>
          onStageChange(event.target.value as CandidateStage)
        }
        className="mt-3 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-teal-600"
      >
        <option value="APPLIED">Applied</option>
        <option value="SCREENING">Screening</option>
        <option value="INTERVIEW">Interview</option>
        <option value="SELECTED">Selected</option>
        <option value="HIRED">Hired</option>
        <option value="REJECTED">Rejected</option>
      </select>
    </div>
  );
}
