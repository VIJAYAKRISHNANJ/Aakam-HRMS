import { useState } from "react";
import type {
  Candidate,
  CandidateStage,
} from "../../services/recruitmentService.ts";
import {
  CandidateCompactCard,
  stageLabels,
  stages,
} from "./RecruitmentComponents";

export default function RecruitmentPipeline({
  candidates,
  onStageChange,
}: {
  candidates: Candidate[];
  onStageChange: (id: number, stage: CandidateStage) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<number | null>(null);
  const handleChange = async (id: number, stage: CandidateStage) => {
    setUpdating(id);
    await onStageChange(id, stage);
    setUpdating(null);
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stages.map((stage) => (
        <section
          key={stage}
          className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
              {stageLabels[stage]}
            </h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
              {
                candidates.filter((candidate) => candidate.stage === stage)
                  .length
              }
            </span>
          </div>
          <div className="space-y-2">
            {candidates
              .filter((candidate) => candidate.stage === stage)
              .map((candidate) => (
                <div
                  key={candidate.id}
                  className={updating === candidate.id ? "opacity-60" : ""}
                >
                  <CandidateCompactCard
                    candidate={candidate}
                    onStageChange={(nextStage) =>
                      handleChange(candidate.id, nextStage)
                    }
                  />
                </div>
              ))}
            {candidates.every((candidate) => candidate.stage !== stage) && (
              <p className="py-6 text-center text-xs text-slate-400">
                No candidates
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
