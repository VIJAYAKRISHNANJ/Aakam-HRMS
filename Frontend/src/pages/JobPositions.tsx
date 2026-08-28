import { Edit, Eye, Plus, Trash2, X, XCircle } from "lucide-react";

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  SearchInput,
  StateMessage,
  StatusBadge,
} from "../components/recruitment/RecruitmentComponents";

import {
  deleteJobPosition,
  getJobPositions,
  getRecruitmentErrorMessage,
  updateJobPosition,
  type JobPosition,
  type JobStatus,
} from "../services/recruitmentService.ts";

function JobPositions() {
  const [jobs, setJobs] = useState<JobPosition[]>([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<"" | JobStatus>("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [actionError, setActionError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Custom Delete Confirmation
  |--------------------------------------------------------------------------
  */

  const [jobToDelete, setJobToDelete] = useState<JobPosition | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Jobs
  |--------------------------------------------------------------------------
  */

  const load = () => {
    setLoading(true);
    setError("");

    getJobPositions()
      .then(setJobs)
      .catch((requestError: unknown) =>
        setError(
          getRecruitmentErrorMessage(
            requestError,
            "Unable to load job positions.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter Jobs
  |--------------------------------------------------------------------------
  */

  const filtered = jobs.filter(
    (job) =>
      `${job.title} ${job.department}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || job.status === status),
  );

  /*
  |--------------------------------------------------------------------------
  | Close Job
  |--------------------------------------------------------------------------
  */

  const closeJob = async (job: JobPosition) => {
    try {
      await updateJobPosition(job.id, {
        title: job.title,
        departmentId: job.departmentId,
        openings: job.openings,
        status: "CLOSED",
      });

      setSuccessMessage(`${job.title} was closed successfully.`);

      load();
    } catch (requestError: unknown) {
      setError(
        getRecruitmentErrorMessage(
          requestError,
          "Unable to close job position.",
        ),
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Open Delete Modal
  |--------------------------------------------------------------------------
  */

  const openDeleteModal = (job: JobPosition) => {
    setActionError("");
    setSuccessMessage("");
    setJobToDelete(job);
  };

  /*
  |--------------------------------------------------------------------------
  | Close Delete Modal
  |--------------------------------------------------------------------------
  */

  const closeDeleteModal = () => {
    if (deletingId !== null) {
      return;
    }

    setJobToDelete(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Job
  |--------------------------------------------------------------------------
  */

  const removeJob = async () => {
    if (!jobToDelete) {
      return;
    }

    const job = jobToDelete;

    setActionError("");
    setSuccessMessage("");
    setDeletingId(job.id);

    try {
      await deleteJobPosition(job.id);

      setJobs((current) => current.filter((item) => item.id !== job.id));

      setJobToDelete(null);

      setSuccessMessage(`${job.title} was deleted successfully.`);
    } catch (requestError: unknown) {
      setActionError(
        getRecruitmentErrorMessage(
          requestError,
          "Unable to delete job position.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <PageHeader
          title="Job Positions"
          subtitle="Create and manage the roles your team is hiring for."
          action={
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
                hover:bg-teal-800
              "
            >
              <Plus size={16} />
              Add Job
            </Link>
          }
        />

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search job title or department..."
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "" | JobStatus)
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
              "
            >
              <option value="">All statuses</option>

              <option value="OPEN">Open</option>

              <option value="CLOSED">Closed</option>
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
            TABLE STATES
        ===================================================== */}

        {loading ? (
          <StateMessage type="loading">Loading job positions...</StateMessage>
        ) : error ? (
          <StateMessage type="error">{error}</StateMessage>
        ) : filtered.length === 0 ? (
          <StateMessage type="empty">No job positions found.</StateMessage>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
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
                    <th className="px-5 py-3">Job Title</th>

                    <th className="px-5 py-3">Department</th>

                    <th className="px-5 py-3">Openings</th>

                    <th className="px-5 py-3">Status</th>

                    <th className="px-5 py-3">Created Date</th>

                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {job.title}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {job.department}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {job.openings}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={job.status} />
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {job.createdAt}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          {/* VIEW */}

                          <Link
                            title="View"
                            to={`/recruitment/jobs/${job.id}`}
                            className="
                                rounded-md
                                p-2
                                text-slate-500
                                hover:bg-slate-100
                                hover:text-teal-700
                              "
                          >
                            <Eye size={16} />
                          </Link>

                          {/* EDIT */}

                          <Link
                            title="Edit"
                            to={`/recruitment/jobs/edit/${job.id}`}
                            className="
                                rounded-md
                                p-2
                                text-slate-500
                                hover:bg-slate-100
                                hover:text-teal-700
                              "
                          >
                            <Edit size={16} />
                          </Link>

                          {/* CLOSE */}

                          {job.status === "OPEN" && (
                            <button
                              type="button"
                              title="Close"
                              onClick={() => closeJob(job)}
                              className="
                                  rounded-md
                                  p-2
                                  text-slate-500
                                  hover:bg-amber-50
                                  hover:text-amber-700
                                "
                            >
                              <XCircle size={16} />
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${job.title}`}
                            onClick={() => openDeleteModal(job)}
                            disabled={deletingId === job.id}
                            className="
                                rounded-md
                                p-2
                                text-slate-500
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          CUSTOM DELETE CONFIRMATION MODAL
      ===================================================== */}

      {jobToDelete && (
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
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-job-title"
            aria-describedby="delete-job-description"
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
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-start justify-between gap-4">
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
                    id="delete-job-title"
                    className="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Delete Job Position
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Permanent action
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingId !== null}
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

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="mt-6">
              <p
                id="delete-job-description"
                className="
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900">
                  {jobToDelete.title}
                </span>
                ?
              </p>

              <p className="mt-2 text-sm text-slate-500">
                This action cannot be undone. The job position will be
                permanently removed from the recruitment records.
              </p>
            </div>

            {/* =================================================
                MODAL ACTIONS
            ================================================= */}

            <div className="mt-7 flex justify-end gap-3">
              {/* CANCEL */}

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingId !== null}
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

              {/* DELETE */}

              <button
                type="button"
                onClick={removeJob}
                disabled={deletingId !== null}
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

export default JobPositions;
