import {
  BarChart3,
  Plus,
  Users,
  UserRound,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  JobMiniCard,
  PageHeader,
  stageLabels,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";
import type {
  CandidateStage,
  JobPosition,
  RecruitmentStats,
} from "../services/recruitmentService.ts";
import {
  getJobPositions,
  getRecruitmentStats,
  getRecruitmentErrorMessage,
} from "../services/recruitmentService.ts";

const statItems = [
  {
    key: "totalJobPositions",
    label: "Total Job Positions",
    icon: BriefcaseBusiness,
    color: "bg-sky-50 text-sky-700",
  },
  {
    key: "openPositions",
    label: "Open Positions",
    icon: BarChart3,
    color: "bg-teal-50 text-teal-700",
  },
  {
    key: "totalCandidates",
    label: "Total Candidates",
    icon: Users,
    color: "bg-violet-50 text-violet-700",
  },
  {
    key: "inInterview",
    label: "In Interview",
    icon: Clock3,
    color: "bg-amber-50 text-amber-700",
  },
  {
    key: "selected",
    label: "Selected",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "hired",
    label: "Hired",
    icon: UserRound,
    color: "bg-cyan-50 text-cyan-700",
  },
] as const;

function Recruitment() {
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getRecruitmentStats(), getJobPositions()])
      .then(([statsData, jobData]) => {
        setStats(statsData);
        setJobs(jobData);
      })
      .catch((requestError: unknown) =>
        setError(
          getRecruitmentErrorMessage(
            requestError,
            "Unable to load recruitment data.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        <PageHeader
          title="Recruitment"
          subtitle="Manage job openings, candidates and the hiring pipeline."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                to="/recruitment/candidates/new"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Candidate
              </Link>
              <Link
                to="/recruitment/jobs/new"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus size={16} />
                Add Job
              </Link>
            </div>
          }
        />
        {loading ? (
          <StateMessage type="loading">
            Loading recruitment data...
          </StateMessage>
        ) : error ? (
          <StateMessage type="error">{error}</StateMessage>
        ) : (
          stats && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {statItems.map(({ key, label, icon: Icon, color }) => (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div
                      className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
                    >
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats[key]}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Open positions
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Your most recent hiring needs
                      </p>
                    </div>
                    <Link
                      to="/recruitment/jobs"
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                    >
                      View all jobs
                    </Link>
                  </div>
                  {jobs
                    .filter((job) => job.status === "OPEN")
                    .slice(0, 4)
                    .map((job) => (
                      <JobMiniCard key={job.id} job={job} />
                    ))}
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Candidate pipeline
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Track candidates through every hiring stage
                      </p>
                    </div>
                    <Link
                      to="/recruitment/candidates"
                      className="text-xs font-semibold text-teal-700"
                    >
                      View candidates
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {(
                      Object.entries(stats.pipeline) as [
                        CandidateStage,
                        number,
                      ][]
                    ).map(([stage, count]) => (
                      <div key={stage} className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-500">
                          {stageLabels[stage as keyof typeof stageLabels]}
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-900">
                          {count}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
export default Recruitment;
