import { ArrowLeft, Check, Edit, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  PageHeader,
  StageBadge,
  stageLabels,
  stages,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";
import {
  getCandidateById,
  getRecruitmentErrorMessage,
  isCandidateStage,
  updateCandidateStage,
  type Candidate,
  type CandidateStage,
} from "../services/recruitmentService.ts";

function CandidateProfile() {
  const { id } = useParams();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (id)
      getCandidateById(id)
        .then(setCandidate)
        .catch((requestError: unknown) =>
          setError(
            getRecruitmentErrorMessage(
              requestError,
              "Unable to load candidate profile.",
            ),
          ),
        )
        .finally(() => setLoading(false));
  }, [id]);
  const move = async (stage: CandidateStage) => {
    if (!candidate) return;
    try {
      const updated = await updateCandidateStage(candidate.id, stage);
      setCandidate(updated);
    } catch (requestError: unknown) {
      setError(
        getRecruitmentErrorMessage(
          requestError,
          "Unable to update candidate stage.",
        ),
      );
    }
  };
  const currentIndex =
    candidate && isCandidateStage(candidate.stage)
      ? stages.indexOf(candidate.stage)
      : -1;
  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            to="/recruitment/candidates"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back to candidates"
          >
            <ArrowLeft size={17} />
          </Link>
          <span className="text-sm text-slate-500">Candidate profile</span>
        </div>
        {loading ? (
          <StateMessage type="loading">
            Loading candidate profile...
          </StateMessage>
        ) : error || !candidate ? (
          <StateMessage type="error">
            {error || "Candidate not found."}
          </StateMessage>
        ) : (
          <>
            <PageHeader
              title={candidate.name}
              subtitle={candidate.email}
              action={
                <Link
                  to={`/recruitment/candidates/edit/${candidate.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit size={16} />
                  Edit Candidate
                </Link>
              }
            />
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-lg font-bold">
                    {candidate.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {candidate.name}
                    </h2>
                    <p className="text-sm text-slate-500">{candidate.email}</p>
                  </div>
                </div>
                <dl className="space-y-4 border-t border-slate-100 pt-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Job position</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {candidate.jobPosition}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Department</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {candidate.department}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Applied date</dt>
                    <dd className="font-medium text-slate-800">
                      {candidate.appliedAt}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Current stage</dt>
                    <dd>
                      <StageBadge stage={candidate.stage} />
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-semibold text-slate-900">
                  Stage progression
                </h2>
                <div className="mt-6 space-y-1">
                  {stages
                    .filter((stage) => stage !== "REJECTED")
                    .map((stage, index) => {
                      const active = stage === candidate.stage;
                      const complete = currentIndex > index;
                      return (
                        <div key={stage} className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${active ? "border-teal-600 bg-teal-600 text-white" : complete ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-300"}`}
                          >
                            {complete ? <Check size={15} /> : index + 1}
                          </div>
                          <span
                            className={`text-sm ${active ? "font-bold text-teal-700" : "text-slate-600"}`}
                          >
                            {stageLabels[stage]}
                          </span>
                          {index < 4 && (
                            <div
                              className={`ml-1 h-5 w-px ${complete ? "bg-teal-200" : "bg-slate-200"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
                {candidate.stage === "REJECTED" ? (
                  <div className="mt-5 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    <X size={16} />
                    Candidate rejected
                  </div>
                ) : !isCandidateStage(candidate.stage) ? (
                  <div className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                    Legacy stage: {candidate.stage}
                  </div>
                ) : (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {candidate.stage !== "HIRED" && (
                      <button
                        onClick={() =>
                          move(stages[currentIndex + 1] ?? "HIRED")
                        }
                        className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                      >
                        {currentIndex < 3
                          ? `Move to ${stageLabels[stages[currentIndex + 1]]}`
                          : "Hire Candidate"}
                      </button>
                    )}
                    <button
                      onClick={() => move("REJECTED")}
                      className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Reject Candidate
                    </button>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
export default CandidateProfile;
