import { ArrowLeft, Edit, Users, XCircle } from "lucide-react";

import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  StageBadge,
  StateMessage,
  StatusBadge,
} from "../components/recruitment/RecruitmentComponents";

import {
  getCandidates,
  getJobPositionById,
  getRecruitmentErrorMessage,
  updateJobPosition,
  type Candidate,
  type JobPosition,
} from "../services/recruitmentService.ts";

function JobPositionDetails() {
  const { id } = useParams();

  const [job, setJob] = useState<JobPosition | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    Promise.all([getJobPositionById(id), getCandidates()])
      .then(([jobData, candidateData]) => {
        setJob(jobData);

        setCandidates(
          candidateData.filter(
            (candidate: Candidate) =>
              candidate.jobPositionId === Number(id),
          ),
        );
      })
      .catch((requestError: unknown) =>
        setError(
          getRecruitmentErrorMessage(
            requestError,
            "Unable to load job position.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const closeJob = async () => {
    if (!job) return;

    try {
      await updateJobPosition(job.id, {
        title: job.title,
        departmentId: job.departmentId,
        openings: job.openings,
        status: "CLOSED",
      });

      setJob({
        ...job,
        status: "CLOSED",
      });
    } catch (requestError: unknown) {
      setError(
        getRecruitmentErrorMessage(
          requestError,
          "Unable to close job position.",
        ),
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        {/* Back to Job Positions */}
        <div className="flex items-center">
          <Link
            to="/recruitment/jobs"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Back to Job Positions"
          >
            <ArrowLeft size={17} />
            Back to Job Positions
          </Link>
        </div>

        {loading ? (
          <StateMessage type="loading">
            Loading job position...
          </StateMessage>
        ) : error || !job ? (
          <StateMessage type="error">
            {error || "Job position not found."}
          </StateMessage>
        ) : (
          <>
            <PageHeader
              title={job.title}
              subtitle={`${job.department} · Created ${job.createdAt}`}
              action={
                <div className="flex gap-2">
                  <Link
                    to={`/recruitment/jobs/edit/${job.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit size={16} />
                    Edit Job
                  </Link>

                  {job.status === "OPEN" && (
                    <button
                      onClick={closeJob}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                    >
                      <XCircle size={16} />
                      Close Job
                    </button>
                  )}
                </div>
              }
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Department
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {job.department}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Openings
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {job.openings}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge status={job.status} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">
                  Candidates
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {candidates.length}
                </p>
              </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                <Users
                  size={18}
                  className="text-teal-700"
                />

                <h2 className="font-semibold text-slate-900">
                  Associated candidates
                </h2>

                <Link
                  to="/recruitment/candidates"
                  className="ml-auto text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  View Candidates
                </Link>
              </div>

              {candidates.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No candidates have applied for this position.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {candidates.map((candidate) => (
                    <Link
                      key={candidate.id}
                      to={`/recruitment/candidates/${candidate.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {candidate.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {candidate.email}
                        </p>
                      </div>

                      <StageBadge stage={candidate.stage} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default JobPositionDetails;