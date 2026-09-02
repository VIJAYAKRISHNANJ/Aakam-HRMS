import {
  BarChart3,
  Plus,
  Users,
  UserRound,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ArrowRight,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

/*
|--------------------------------------------------------------------------
| Statistic Items
|--------------------------------------------------------------------------
*/

const statItems = [
  {
    key: "totalJobPositions",
    label: "Total Job Positions",
    icon: BriefcaseBusiness,
    color: "bg-sky-50 text-sky-700",
    link: "/recruitment/jobs",
  },

  {
    key: "openPositions",
    label: "Open Positions",
    icon: BarChart3,
    color: "bg-teal-50 text-teal-700",
    link: "/recruitment/jobs",
  },

  {
    key: "totalCandidates",
    label: "Total Candidates",
    icon: Users,
    color: "bg-violet-50 text-violet-700",
    link: "/recruitment/candidates",
  },

  {
    key: "inInterview",
    label: "In Interview",
    icon: Clock3,
    color: "bg-amber-50 text-amber-700",
    link: "/recruitment/candidates",
  },

  {
    key: "selected",
    label: "Selected",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
    link: "/recruitment/candidates",
  },

  {
    key: "hired",
    label: "Hired",
    icon: UserRound,
    color: "bg-cyan-50 text-cyan-700",
    link: "/recruitment/candidates",
  },
] as const;

/*
|--------------------------------------------------------------------------
| Recruitment Dashboard
|--------------------------------------------------------------------------
*/

function Recruitment() {
  const [stats, setStats] =
    useState<RecruitmentStats | null>(
      null,
    );

  const [jobs, setJobs] =
    useState<JobPosition[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Recruitment Data
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    Promise.all([
      getRecruitmentStats(),
      getJobPositions(),
    ])
      .then(
        ([
          statsData,
          jobData,
        ]) => {
          setStats(statsData);

          setJobs(jobData);
        },
      )
      .catch(
        (
          requestError: unknown,
        ) =>
          setError(
            getRecruitmentErrorMessage(
              requestError,
              "Unable to load recruitment data.",
            ),
          ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open Jobs
  |--------------------------------------------------------------------------
  */

  const openJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.status === "OPEN",
      ),
    [jobs],
  );

  /*
  |--------------------------------------------------------------------------
  | Total Openings
  |
  | Example:
  |
  | Tech Support Engineer       1
  | Senior Software Engineer    3
  | -----------------------------
  | Total Openings              4
  |--------------------------------------------------------------------------
  */

  const totalOpenings = useMemo(
    () =>
      openJobs.reduce(
        (
          total,
          job,
        ) =>
          total +
          Number(
            job.openings || 0,
          ),
        0,
      ),
    [openJobs],
  );

  /*
  |--------------------------------------------------------------------------
  | Statistic Value
  |--------------------------------------------------------------------------
  */

  const getStatValue = (
    key: (typeof statItems)[number]["key"],
  ): number => {
    if (!stats) {
      return 0;
    }

    if (
      key ===
      "totalJobPositions"
    ) {
      return jobs.length;
    }

    if (
      key === "openPositions"
    ) {
      return totalOpenings;
    }

    return stats[key];
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <PageHeader
          title="Recruitment"
          subtitle="Manage job openings, candidates and the hiring pipeline."
          action={
            <div className="flex flex-wrap gap-2">

              {/* ADD CANDIDATE */}

              <Link
                to="/recruitment/candidates/new"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-50
                "
              >
                <Plus size={16} />

                Add Candidate
              </Link>

              {/* ADD JOB */}

              <Link
                to="/recruitment/jobs/new"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-teal-700
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-teal-800
                "
              >
                <Plus size={16} />

                Add Job
              </Link>

            </div>
          }
        />

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <StateMessage type="loading">
            Loading recruitment data...
          </StateMessage>
        ) : error ? (
          /* =================================================
             ERROR
          ================================================= */

          <StateMessage type="error">
            {error}
          </StateMessage>
        ) : (
          stats && (
            <>
              {/* =================================================
                  RECRUITMENT STATISTICS
              ================================================= */}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">

                {statItems.map(
                  ({
                    key,
                    label,
                    icon: Icon,
                    color,
                    link,
                  }) => (
                    <Link
                      key={key}
                      to={link}
                      className="
                        group
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        p-4
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:border-slate-300
                        hover:shadow-md
                      "
                    >

                      {/* ICON */}

                      <div
                        className={`
                          mb-4
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          ${color}
                        `}
                      >
                        <Icon size={18} />
                      </div>

                      {/* VALUE */}

                      <div className="flex items-center justify-between gap-2">

                        <p className="text-2xl font-bold text-slate-900">
                          {getStatValue(
                            key,
                          )}
                        </p>

                        <ArrowRight
                          size={15}
                          className="
                            text-slate-300
                            opacity-0
                            transition-all
                            duration-200
                            group-hover:translate-x-0.5
                            group-hover:text-slate-500
                            group-hover:opacity-100
                          "
                        />

                      </div>

                      {/* LABEL */}

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {label}
                      </p>

                    </Link>
                  ),
                )}

              </div>

              {/* =================================================
                  LOWER DASHBOARD
              ================================================= */}

              <div className="grid gap-6 xl:grid-cols-[1.05fr_1.95fr]">

                {/* =================================================
                    OPEN POSITIONS
                ================================================= */}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                  {/* HEADER */}

                  <div className="px-5 pt-5">

                    <div className="flex items-center justify-between gap-4">

                      <div>
                        <h2 className="font-semibold text-slate-900">
                          Open positions
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Your most recent hiring needs
                        </p>
                      </div>

                      {/* VIEW ALL JOBS */}

                      <Link
                        to="/recruitment/jobs"
                        className="
                          inline-flex
                          shrink-0
                          items-center
                          gap-1.5
                          rounded-lg
                          border
                          border-slate-200
                          bg-white
                          px-3
                          py-2
                          text-sm
                          font-semibold
                          text-slate-700
                          shadow-sm
                          transition-all
                          duration-200
                          hover:border-slate-300
                          hover:bg-slate-50
                          hover:text-slate-900
                          hover:shadow
                        "
                      >
                        View all jobs

                        <ArrowRight
                          size={15}
                        />
                      </Link>

                    </div>

                  </div>

                  {/* =================================================
                      SEPARATOR
                  ================================================= */}

                  <div className="mt-4 border-b border-slate-200" />

                  {/* =================================================
                      JOB LIST
                  ================================================= */}

                  <div className="px-5 pb-3">

                    {openJobs
                      .slice(0, 4)
                      .map(
                        (job) => (
                          <JobMiniCard
                            key={
                              job.id
                            }
                            job={job}
                          />
                        ),
                      )}

                    {openJobs.length ===
                      0 && (
                      <div className="py-8 text-center">

                        <p className="text-sm font-medium text-slate-600">
                          No open positions
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Create a job position
                          to start hiring.
                        </p>

                      </div>
                    )}

                  </div>

                </section>

                {/* =================================================
                    CANDIDATE PIPELINE
                ================================================= */}

                <section className="rounded-xl border border-slate-200 bg-white p-5">

                  {/* HEADER */}

                  <div className="mb-4 flex items-center justify-between gap-4">

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Candidate pipeline
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Track candidates through every hiring stage
                      </p>
                    </div>

                    {/* VIEW CANDIDATES */}

                    <Link
                      to="/recruitment/candidates"
                      className="
                        inline-flex
                        shrink-0
                        items-center
                        gap-1.5
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-slate-700
                        shadow-sm
                        transition-all
                        duration-200
                        hover:border-slate-300
                        hover:bg-slate-50
                        hover:text-slate-900
                        hover:shadow
                      "
                    >
                      View candidates

                      <ArrowRight
                        size={15}
                      />
                    </Link>

                  </div>

                  {/* =================================================
                      PIPELINE STAGES
                  ================================================= */}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

                    {(
                      Object.entries(
                        stats.pipeline,
                      ) as [
                        CandidateStage,
                        number,
                      ][]
                    ).map(
                      ([
                        stage,
                        count,
                      ]) => (
                        <div
                          key={stage}
                          className="
                            rounded-lg
                            bg-slate-50
                            p-3
                            transition
                            hover:bg-slate-100
                          "
                        >

                          <p className="text-xs font-medium text-slate-500">
                            {
                              stageLabels[
                                stage as keyof typeof stageLabels
                              ]
                            }
                          </p>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {count}
                          </p>

                        </div>
                      ),
                    )}

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