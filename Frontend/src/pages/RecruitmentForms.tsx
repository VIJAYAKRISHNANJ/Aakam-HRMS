import { ArrowLeft, BriefcaseBusiness, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  CandidateFields,
  JobFields,
  RecruitmentFormShell,
  type CandidateFormValue,
  type JobFormValue,
} from "../components/recruitment/RecruitmentForm";
import {
  createCandidate,
  createJobPosition,
  getCandidateById,
  getJobPositionById,
  getJobPositions,
  getRecruitmentErrorMessage,
  updateCandidate,
  updateJobPosition,
  type CandidateStage,
  type Candidate,
  type JobPosition,
  type JobStatus,
} from "../services/recruitmentService.ts";

const initialJob: JobFormValue = {
  title: "",
  departmentId: "",
  openings: "1",
  status: "OPEN",
};
const initialCandidate: CandidateFormValue = {
  name: "",
  email: "",
  jobPositionId: "",
  stage: "APPLIED",
};
function FormPage({
  kind,
  edit = false,
}: {
  kind: "job" | "candidate";
  edit?: boolean;
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [jobValue, setJobValue] = useState(initialJob);
  const [candidateValue, setCandidateValue] = useState(initialCandidate);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(edit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (kind === "candidate")
      getJobPositions()
        .then(setJobs)
        .catch((requestError: unknown) =>
          setError(
            getRecruitmentErrorMessage(
              requestError,
              "Unable to load job positions.",
            ),
          ),
        );
    if (edit && id) {
      const load =
        kind === "job"
          ? getJobPositionById(id).then((job: JobPosition) =>
              setJobValue({
                title: job.title,
                departmentId: String(job.departmentId),
                openings: String(job.openings),
                status: job.status,
              }),
            )
          : getCandidateById(id).then((candidate: Candidate) =>
              setCandidateValue({
                name: candidate.name,
                email: candidate.email,
                jobPositionId: String(candidate.jobPositionId),
                stage: candidate.stage,
              }),
            );
      load
        .catch((requestError: unknown) =>
          setError(
            getRecruitmentErrorMessage(requestError, `Unable to load ${kind}.`),
          ),
        )
        .finally(() => setLoading(false));
    }
  }, [edit, id, kind]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (kind === "job") {
      if (
        !jobValue.title.trim() ||
        !jobValue.departmentId ||
        !jobValue.openings ||
        Number(jobValue.openings) <= 0
      ) {
        setError(
          "Enter a title, department, and a positive number of openings.",
        );
        return;
      }
    } else if (
      !candidateValue.name.trim() ||
      !candidateValue.email.includes("@") ||
      !candidateValue.jobPositionId
    ) {
      setError("Enter a name, valid email, and job position.");
      return;
    }
    try {
      setSaving(true);
      if (kind === "job") {
        const payload = {
          title: jobValue.title.trim(),
          departmentId: Number(jobValue.departmentId),
          openings: Number(jobValue.openings),
          status: jobValue.status as JobStatus,
        };
        if (edit && id) await updateJobPosition(id, payload);
        else await createJobPosition(payload);
        navigate("/recruitment/jobs");
      } else {
        const payload = {
          name: candidateValue.name.trim(),
          email: candidateValue.email.trim(),
          jobPositionId: Number(candidateValue.jobPositionId),
          stage: candidateValue.stage as CandidateStage,
        };
        if (edit && id) await updateCandidate(id, payload);
        else await createCandidate(payload);
        navigate("/recruitment/candidates");
      }
    } catch (requestError: unknown) {
      setError(
        getRecruitmentErrorMessage(
          requestError,
          `Unable to ${edit ? "save" : "create"} ${kind}. Please try again.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  };
  const isJob = kind === "job";
  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            to={isJob ? "/recruitment/jobs" : "/recruitment/candidates"}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              {isJob ? (
                <BriefcaseBusiness size={22} />
              ) : (
                <UserRound size={22} />
              )}
            </div>
            <div>
              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                {edit ? "Edit" : "Add"} {isJob ? "Job Position" : "Candidate"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {isJob
                  ? "Keep your hiring needs up to date."
                  : "Add an applicant to your recruitment pipeline."}
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading {kind}...
          </div>
        ) : (
          <RecruitmentFormShell
            title={isJob ? "Job Information" : "Candidate Information"}
            description="Complete the required details below."
            error={error}
            loading={saving}
            onSubmit={submit}
            submitLabel={
              edit ? "Save Changes" : isJob ? "Create Job" : "Add Candidate"
            }
          >
            {isJob ? (
              <JobFields
                value={jobValue}
                onChange={setJobValue}
                disabled={saving}
              />
            ) : (
              <CandidateFields
                value={candidateValue}
                jobs={jobs}
                onChange={setCandidateValue}
                disabled={saving}
              />
            )}
          </RecruitmentFormShell>
        )}
      </div>
    </DashboardLayout>
  );
}
export function AddJobPosition() {
  return <FormPage kind="job" />;
}
export function EditJobPosition() {
  return <FormPage kind="job" edit />;
}
export function AddCandidate() {
  return <FormPage kind="candidate" />;
}
export function EditCandidate() {
  return <FormPage kind="candidate" edit />;
}
