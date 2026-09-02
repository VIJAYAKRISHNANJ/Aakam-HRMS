import { ArrowLeft, GraduationCap, Save } from "lucide-react";

import { useState } from "react";

import type { FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import { PageHeader } from "../components/recruitment/RecruitmentComponents";

import {
  createTrainingProgram,
  getTrainingErrorMessage,
  type TrainingMode,
  type TrainingStatus,
} from "../services/trainingService";

function AddTraining() {
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState("");
  const [category, setCategory] = useState("");
  const [trainer, setTrainer] = useState("");
  const [duration, setDuration] = useState("");
  const [cost, setCost] = useState("");
  const [mode, setMode] =
    useState<TrainingMode>("ONLINE");
  const [assessment, setAssessment] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [status, setStatus] =
    useState<TrainingStatus>("ACTIVE");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !courseName.trim() ||
      !category.trim() ||
      !trainer.trim() ||
      !duration.trim() ||
      !cost
    ) {
      setError(
        "Course name, category, trainer, duration, and cost are required.",
      );
      return;
    }

    const numericCost = Number(cost);

    if (
      !Number.isFinite(numericCost) ||
      numericCost < 0
    ) {
      setError(
        "Cost must be a non-negative number.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const program =
        await createTrainingProgram({
          courseName:
            courseName.trim(),

          category:
            category.trim(),

          trainer:
            trainer.trim(),

          duration:
            duration.trim(),

          cost: numericCost,

          mode,

          assessment:
            assessment.trim() || null,

          description:
            description.trim() || null,

          status,
        });

      navigate(
        `/training/${program.id}`,
      );
    } catch (requestError) {
      setError(
        getTrainingErrorMessage(
          requestError,
          "Failed to create training program.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex w-full flex-col gap-6">
        <Link
          to="/training"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Training"
        >
          <ArrowLeft size={17} />
          Back to Training
        </Link>

        <PageHeader
          title="Add Training"
          subtitle="Create a training program for employee development."
          icon={GraduationCap}
        />

        <form
          onSubmit={submit}
          className="w-full rounded-xl border border-slate-200 bg-white p-6"
        >
          <h2 className="font-semibold text-slate-900">
            Training information
          </h2>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Course Name

              <input
                required
                value={courseName}
                onChange={(event) =>
                  setCourseName(
                    event.target.value,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Category

              <input
                required
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Trainer

              <input
                required
                value={trainer}
                onChange={(event) =>
                  setTrainer(
                    event.target.value,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Duration

              <input
                required
                value={duration}
                onChange={(event) =>
                  setDuration(
                    event.target.value,
                  )
                }
                placeholder="e.g. 3 days"
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Cost

              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) =>
                  setCost(
                    event.target.value,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Mode

              <select
                value={mode}
                onChange={(event) =>
                  setMode(
                    event.target
                      .value as TrainingMode,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
              >
                <option value="ONLINE">
                  Online
                </option>

                <option value="OFFLINE">
                  Offline
                </option>

                <option value="HYBRID">
                  Hybrid
                </option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Assessment

              <input
                value={assessment}
                onChange={(event) =>
                  setAssessment(
                    event.target.value,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Status

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as TrainingStatus,
                  )
                }
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Description

              <textarea
                rows={4}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-teal-600"
              />
            </label>
          </div>

          <div className="mt-7 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Create Training"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AddTraining;