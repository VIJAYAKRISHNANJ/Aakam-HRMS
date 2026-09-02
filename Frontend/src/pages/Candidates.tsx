import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import RecruitmentPipeline from "../components/recruitment/RecruitmentPipeline";

import {
  PageHeader,
  SearchInput,
  StageBadge,
  stages,
  stageLabels,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  deleteCandidate,
  getCandidates,
  getJobPositions,
  getRecruitmentErrorMessage,
  updateCandidateStage,
  type Candidate,
  type CandidateStage,
  type JobPosition,
} from "../services/recruitmentService";


function Candidates() {
  const navigate = useNavigate();

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [jobs, setJobs] =
    useState<JobPosition[]>([]);

  const [search, setSearch] =
    useState("");

  const [stage, setStage] =
    useState<"" | CandidateStage>("");

  const [job, setJob] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [candidateToDelete, setCandidateToDelete] =
    useState<Candidate | null>(null);


  /*
  |--------------------------------------------------------------------------
  | Load candidates and job positions
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    Promise.all([
      getCandidates(),
      getJobPositions(),
    ])
      .then(([candidateData, jobData]) => {
        setCandidates(candidateData);
        setJobs(jobData);
      })
      .catch((requestError: unknown) => {
        setError(
          getRecruitmentErrorMessage(
            requestError,
            "Unable to load candidates.",
          ),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Filtering
  |--------------------------------------------------------------------------
  */

  const filtered = candidates.filter(
    (candidate) => {
      const searchableText =
        `${candidate.name} ${candidate.email} ${candidate.jobPosition}`
          .toLowerCase();

      const matchesSearch =
        searchableText.includes(
          search.toLowerCase(),
        );

      const matchesStage =
        !stage ||
        candidate.stage === stage;

      const matchesJob =
        !job ||
        candidate.jobPositionId === Number(job);

      return (
        matchesSearch &&
        matchesStage &&
        matchesJob
      );
    },
  );


  /*
  |--------------------------------------------------------------------------
  | Change candidate stage
  |--------------------------------------------------------------------------
  */

  const changeStage = async (
    id: number,
    nextStage: CandidateStage,
  ) => {
    try {
      const updated =
        await updateCandidateStage(
          id,
          nextStage,
        );

      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === id
            ? updated
            : candidate,
        ),
      );
    } catch (requestError: unknown) {
      setError(
        getRecruitmentErrorMessage(
          requestError,
          "Unable to update candidate stage.",
        ),
      );
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Open delete confirmation
  |--------------------------------------------------------------------------
  */

  const openDeleteModal = (
    candidate: Candidate,
  ) => {
    setActionError("");
    setSuccessMessage("");
    setCandidateToDelete(candidate);
  };


  /*
  |--------------------------------------------------------------------------
  | Close delete confirmation
  |--------------------------------------------------------------------------
  */

  const closeDeleteModal = () => {
    if (deletingId !== null) {
      return;
    }

    setCandidateToDelete(null);
  };


  /*
  |--------------------------------------------------------------------------
  | Delete candidate
  |--------------------------------------------------------------------------
  */

  const removeCandidate = async () => {
    if (!candidateToDelete) {
      return;
    }

    const candidate =
      candidateToDelete;

    setActionError("");
    setSuccessMessage("");
    setDeletingId(candidate.id);

    try {
      await deleteCandidate(candidate.id);

      setCandidates((current) =>
        current.filter(
          (item) =>
            item.id !== candidate.id,
        ),
      );

      setCandidateToDelete(null);

      setSuccessMessage(
        `${candidate.name} was deleted successfully.`,
      );
    } catch (requestError: unknown) {
      setActionError(
        getRecruitmentErrorMessage(
          requestError,
          "Unable to delete candidate.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Open candidate profile
  |--------------------------------------------------------------------------
  */

  const openCandidateProfile = (
    candidateId: number,
  ) => {
    navigate(
      `/recruitment/candidates/${candidateId}`,
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <DashboardLayout>

      <div className="flex min-w-0 flex-col gap-6">


        {/* =====================================================
            BACK TO RECRUITMENT
        ===================================================== */}

        <Link
          to="/recruitment"
          className="
            inline-flex
            w-fit
            items-center
            gap-2.5
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-900
            shadow-sm
            transition-all
            duration-200
            hover:border-slate-400
            hover:bg-slate-50
            hover:shadow-md
          "
        >
          <ArrowLeft
            size={19}
            strokeWidth={2.2}
          />

          Back to Recruitment
        </Link>


        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <PageHeader
          title="Candidates"
          subtitle="Review applicants and move them through your hiring process."
          action={
            <Link
              to="/recruitment/candidates/new"
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

              Add Candidate
            </Link>
          }
        />


        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-4
          "
        >

          <div
            className="
              grid
              gap-3
              md:grid-cols-[minmax(0,1fr)_180px_210px]
            "
          >

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search candidates..."
            />


            {/* Stage filter */}

            <select
              value={stage}
              onChange={(event) =>
                setStage(
                  event.target.value as
                    | ""
                    | CandidateStage,
                )
              }
              className="
                h-10
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                outline-none
                focus:border-teal-600
                focus:ring-2
                focus:ring-teal-600/20
              "
            >

              <option value="">
                All stages
              </option>

              {stages.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {stageLabels[item]}
                </option>
              ))}

            </select>


            {/* Job filter */}

            <select
              value={job}
              onChange={(event) =>
                setJob(
                  event.target.value,
                )
              }
              className="
                h-10
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                outline-none
                focus:border-teal-600
                focus:ring-2
                focus:ring-teal-600/20
              "
            >

              <option value="">
                All job positions
              </option>

              {jobs.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.title}
                </option>
              ))}

            </select>

          </div>

        </section>


        {/* =====================================================
            SUCCESS MESSAGE
        ===================================================== */}

        {successMessage && (
          <div
            className="
              rounded-lg
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
              text-sm
              text-emerald-700
            "
          >
            {successMessage}
          </div>
        )}


        {/* =====================================================
            ACTION ERROR
        ===================================================== */}

        {actionError && (
          <div
            className="
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            {actionError}
          </div>
        )}


        {/* =====================================================
            CANDIDATES TABLE
        ===================================================== */}

        {loading ? (

          <StateMessage type="loading">
            Loading candidates...
          </StateMessage>

        ) : error ? (

          <StateMessage type="error">
            {error}
          </StateMessage>

        ) : filtered.length === 0 ? (

          <StateMessage type="empty">
            No candidates found.
          </StateMessage>

        ) : (

          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
            "
          >

            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  min-w-[850px]
                  text-left
                  text-sm
                "
              >

                <thead
                  className="
                    border-b
                    border-slate-200
                    bg-slate-50
                    text-xs
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >

                  <tr>

                    <th className="px-5 py-3">
                      Candidate
                    </th>

                    <th className="px-5 py-3">
                      Job Position
                    </th>

                    <th className="px-5 py-3">
                      Department
                    </th>

                    <th className="px-5 py-3">
                      Stage
                    </th>

                    <th className="px-5 py-3">
                      Applied Date
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filtered.map(
                    (candidate) => (

                      <tr
                        key={candidate.id}
                        onClick={() =>
                          openCandidateProfile(
                            candidate.id,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            event.preventDefault();

                            openCandidateProfile(
                              candidate.id,
                            );
                          }
                        }}
                        tabIndex={0}
                        role="link"
                        className="
                          cursor-pointer
                          border-t
                          border-slate-100
                          transition
                          hover:bg-slate-50
                          focus:bg-slate-50
                          focus:outline-none
                        "
                      >

                        {/* Candidate */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-teal-50
                                text-sm
                                font-bold
                                text-teal-700
                              "
                            >
                              {candidate.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              <p
                                className="
                                  truncate
                                  font-medium
                                  text-slate-900
                                "
                              >
                                {candidate.name}
                              </p>

                              <p
                                className="
                                  truncate
                                  text-xs
                                  text-slate-500
                                "
                              >
                                {candidate.email}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* Job Position */}

                        <td
                          className="
                            px-5
                            py-4
                            text-slate-700
                          "
                        >
                          {candidate.jobPosition}
                        </td>


                        {/* Department */}

                        <td
                          className="
                            px-5
                            py-4
                            text-slate-700
                          "
                        >
                          {candidate.department}
                        </td>


                        {/* Stage */}

                        <td className="px-5 py-4">

                          <StageBadge
                            stage={candidate.stage}
                          />

                        </td>


                        {/* Applied Date */}

                        <td
                          className="
                            whitespace-nowrap
                            px-5
                            py-4
                            text-slate-500
                          "
                        >
                          {candidate.appliedAt}
                        </td>


                        {/* Actions */}

                        <td
                          className="px-5 py-4"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >

                          <div
                            className="
                              flex
                              items-center
                              justify-end
                              gap-1
                            "
                          >

                            {/* EDIT */}

                            <Link
                              to={`/recruitment/candidates/edit/${candidate.id}`}
                              title="Edit"
                              aria-label={`Edit ${candidate.name}`}
                              className="
                                rounded-md
                                p-2
                                text-slate-500
                                transition
                                hover:bg-slate-100
                                hover:text-teal-700
                              "
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                            >
                              <Edit size={16} />
                            </Link>


                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete ${candidate.name}`}
                              onClick={(event) => {
                                event.stopPropagation();

                                openDeleteModal(
                                  candidate,
                                );
                              }}
                              disabled={
                                deletingId ===
                                candidate.id
                              }
                              className="
                                rounded-md
                                p-2
                                text-slate-500
                                transition
                                hover:bg-rose-50
                                hover:text-rose-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>

                    ),
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


        {/* =====================================================
            HIRING PIPELINE
        ===================================================== */}

        <section>

          <div className="mb-3">

            <h2
              className="
                text-lg
                font-semibold
                text-slate-900
              "
            >
              Hiring pipeline
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Move candidates between stages as your process progresses.
            </p>

          </div>


          <RecruitmentPipeline
            candidates={candidates}
            onStageChange={changeStage}
          />

        </section>

      </div>


      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

      {candidateToDelete && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-900/50
            px-4
            backdrop-blur-sm
          "
          role="presentation"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }

          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-candidate-title"
            aria-describedby="delete-candidate-description"
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-2xl
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-rose-50
                    text-rose-600
                  "
                >
                  <Trash2 size={21} />
                </div>


                <div>

                  <h2
                    id="delete-candidate-title"
                    className="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Delete Candidate
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    Permanent action
                  </p>

                </div>

              </div>


              {/* Close */}

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={
                  deletingId !== null
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>


            {/* Modal Content */}

            <div className="mt-6">

              <p
                id="delete-candidate-description"
                className="
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                Are you sure you want to delete{" "}

                <span
                  className="
                    font-semibold
                    text-slate-900
                  "
                >
                  {candidateToDelete.name}
                </span>

                ?
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-500
                "
              >
                This action cannot be undone. The
                candidate will be permanently removed
                from the recruitment records.
              </p>

            </div>


            {/* Modal Actions */}

            <div
              className="
                mt-7
                flex
                justify-end
                gap-3
              "
            >

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={
                  deletingId !== null
                }
                className="
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
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={removeCandidate}
                disabled={
                  deletingId !== null
                }
                className="
                  inline-flex
                  min-w-[100px]
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-rose-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-rose-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                {deletingId !== null ? (
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

export default Candidates;