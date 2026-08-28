import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getDepartments,
  type Department,
} from "../../services/departmentService";
import type {
  CandidateStage,
  JobPosition,
  JobStatus,
} from "../../services/recruitmentService.ts";

export interface JobFormValue {
  title: string;
  departmentId: string;
  openings: string;
  status: JobStatus;
}
export interface CandidateFormValue {
  name: string;
  email: string;
  jobPositionId: string;
  stage: CandidateStage | string;
}
const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50";
export function Field({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
export function RecruitmentFormShell({
  title,
  description,
  error,
  loading,
  onSubmit,
  children,
  submitLabel,
}: {
  title: string;
  description: string;
  error: string;
  loading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  submitLabel: string;
}) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);
  return departments;
}
export function JobFields({
  value,
  onChange,
  disabled,
}: {
  value: JobFormValue;
  onChange: (value: JobFormValue) => void;
  disabled: boolean;
}) {
  const departments = useDepartments();
  return (
    <>
      <Field label="Job Title">
        <input
          className={inputClass}
          value={value.title}
          onChange={(event) =>
            onChange({ ...value, title: event.target.value })
          }
          placeholder="e.g. Software Engineer"
          disabled={disabled}
        />
      </Field>
      <Field label="Department">
        <select
          className={inputClass}
          value={value.departmentId}
          onChange={(event) =>
            onChange({ ...value, departmentId: event.target.value })
          }
          disabled={disabled}
        >
          <option value="">Select department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Departments are loaded from the existing organization service.
        </p>
      </Field>
      <Field label="Number of Openings">
        <input
          className={inputClass}
          type="number"
          min="1"
          value={value.openings}
          onChange={(event) =>
            onChange({ ...value, openings: event.target.value })
          }
          placeholder="e.g. 2"
          disabled={disabled}
        />
      </Field>
      <Field label="Status">
        <select
          className={inputClass}
          value={value.status}
          onChange={(event) =>
            onChange({ ...value, status: event.target.value as JobStatus })
          }
          disabled={disabled}
        >
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </Field>
    </>
  );
}
export function CandidateFields({
  value,
  jobs,
  onChange,
  disabled,
}: {
  value: CandidateFormValue;
  jobs: JobPosition[];
  onChange: (value: CandidateFormValue) => void;
  disabled: boolean;
}) {
  return (
    <>
      <Field label="Candidate Name">
        <input
          className={inputClass}
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="e.g. Ananya Rao"
          disabled={disabled}
        />
      </Field>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          value={value.email}
          onChange={(event) =>
            onChange({ ...value, email: event.target.value })
          }
          placeholder="candidate@example.com"
          disabled={disabled}
        />
      </Field>
      <Field label="Job Position">
        <select
          className={inputClass}
          value={value.jobPositionId}
          onChange={(event) =>
            onChange({ ...value, jobPositionId: event.target.value })
          }
          disabled={disabled}
        >
          <option value="">Select job position</option>
          {jobs
            .filter((job) => job.status === "OPEN")
            .map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Stage">
        <select
          className={inputClass}
          value={value.stage}
          onChange={(event) =>
            onChange({ ...value, stage: event.target.value as CandidateStage })
          }
          disabled={disabled}
        >
          {value.stage !== "APPLIED" &&
            value.stage !== "SCREENING" &&
            value.stage !== "INTERVIEW" &&
            value.stage !== "SELECTED" &&
            value.stage !== "HIRED" &&
            value.stage !== "REJECTED" && (
              <option value={value.stage}>{value.stage}</option>
            )}
          <option value="APPLIED">Applied</option>
          <option value="SCREENING">Screening</option>
          <option value="INTERVIEW">Interview</option>
          <option value="SELECTED">Selected</option>
          <option value="HIRED">Hired</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </Field>
    </>
  );
}
