import {
  BookOpen,
  Edit,
  GraduationCap,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  SearchInput,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  deleteTrainingProgram,
  getTrainingErrorMessage,
  getTrainingProgram,
  getTrainingPrograms,
  trainingStatuses,
  type TrainingProgram,
  type TrainingStatus,
} from "../services/trainingService";

const format = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusClasses: Record<TrainingStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

function Training() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<TrainingProgram[]>([]);

  const [enrollmentCounts, setEnrollmentCounts] = useState<
    Record<number, { total: number; completed: number }>
  >({});

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<TrainingProgram | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getTrainingPrograms({
          search,
          category,
          status,
        });

        setPrograms(data);

        const details = await Promise.all(
          data.map((program) => getTrainingProgram(program.id)),
        );

        setEnrollmentCounts(
          Object.fromEntries(
            details.map((detail) => [
              detail.id,
              {
                total: detail.enrollments.length,
                completed: detail.enrollments.filter(
                  (enrollment) =>
                    enrollment.status === "COMPLETED" ||
                    enrollment.status === "CERTIFICATE",
                ).length,
              },
            ]),
          ),
        );
      } catch (requestError) {
        setError(
          getTrainingErrorMessage(
            requestError,
            "Unable to load training programs.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    const timer = window.setTimeout(
      () => {
        void load();
      },
      search ? 300 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [search, category, status]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(programs.map((program) => program.category)),
      ).sort(),
    [programs],
  );

  const summary = [
    [
      "Total Training Programs",
      programs.length,
      BookOpen,
      "bg-teal-50 text-teal-700",
    ],
    [
      "Active Programs",
      programs.filter((program) => program.status === "ACTIVE").length,
      GraduationCap,
      "bg-emerald-50 text-emerald-700",
    ],
    [
      "Total Enrollments",
      Object.values(enrollmentCounts).reduce(
        (sum, value) => sum + value.total,
        0,
      ),
      Users,
      "bg-sky-50 text-sky-700",
    ],
    [
      "Completed Trainings",
      Object.values(enrollmentCounts).reduce(
        (sum, value) => sum + value.completed,
        0,
      ),
      GraduationCap,
      "bg-amber-50 text-amber-700",
    ],
  ] as const;

  const openDeleteModal = (program: TrainingProgram) => {
    setDeleteError("");
    setDeleteTarget(program);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteTrainingProgram(deleteTarget.id);

      setPrograms((current) =>
        current.filter((program) => program.id !== deleteTarget.id),
      );

      setEnrollmentCounts((current) => {
        const next = { ...current };
        delete next[deleteTarget.id];
        return next;
      });

      setDeleteTarget(null);
    } catch (requestError) {
      setDeleteError(
        getTrainingErrorMessage(
          requestError,
          "Failed to delete training program.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Training"
          subtitle="Manage employee training, courses and skill development."
          icon={GraduationCap}
          action={
            <Link
              to="/training/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} />
              Add Training
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(([title, value, Icon, classes]) => (
            <div
              key={title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{title}</p>

                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${classes}`}
                >
                  <Icon size={18} />
                </span>
              </div>

              <p className="mt-4 text-2xl font-semibold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_190px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search course or trainer..."
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
            >
              <option value="">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
            >
              <option value="">All statuses</option>

              {trainingStatuses.map((item) => (
                <option key={item} value={item}>
                  {format(item)}
                </option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <StateMessage type="loading">
            Loading training programs...
          </StateMessage>
        ) : error ? (
          <StateMessage type="error">{error}</StateMessage>
        ) : programs.length === 0 ? (
          <StateMessage type="empty">
            No training programs found.
          </StateMessage>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Course",
                      "Category",
                      "Trainer",
                      "Duration",
                      "Mode",
                      "Cost",
                      "Status",
                      "Enrolled employees",
                      "Actions",
                    ].map((heading) => (
                      <th key={heading} className="px-5 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {programs.map((program) => (
                    <tr
                      key={program.id}
                      onClick={() =>
                        navigate(`/training/${program.id}`)
                      }
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {program.courseName}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {program.category}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {program.trainer}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {program.duration}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {format(program.mode)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {currency(program.cost)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusClasses[
                              program.status as TrainingStatus
                            ] ??
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {format(program.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {enrollmentCounts[program.id]?.total ?? 0}
                      </td>

                      <td
                        className="px-5 py-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Link
                            title="Edit"
                            to={`/training/edit/${program.id}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                          >
                            <Edit size={16} />
                          </Link>

                          <button
                            type="button"
                            title="Delete"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteModal(program);
                            }}
                            className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
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

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Delete training program?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-800">
                      {deleteTarget.courseName}
                    </span>
                    ?
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                  aria-label="Close confirmation"
                >
                  <X size={19} />
                </button>
              </div>

              {deleteError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Training;