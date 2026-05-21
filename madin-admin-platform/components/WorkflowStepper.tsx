"use client";

interface WorkflowStepperProps {
  currentStep: number;
  statut: string;
}

const STEPS = [
  { num: 1, label: "Diagnostic", icon: "🔍", agent: "diagnostiqueur", description: "Éligibilité & cadrage" },
  { num: 2, label: "Montage", icon: "✍️", agent: "monteur", description: "Rédaction du dossier" },
  { num: 3, label: "Checklist", icon: "📋", agent: "documentaliste", description: "Pièces justificatives" },
  { num: 4, label: "Contrôle", icon: "🔒", agent: "contrôleur", description: "Audit de conformité" },
  { num: 5, label: "Dépôt", icon: "📤", agent: "—", description: "Action humaine" },
  { num: 6, label: "Suivi", icon: "📡", agent: "suiveur", description: "Post-dépôt" },
  { num: 7, label: "Archivage", icon: "🗄️", agent: "archiviste", description: "Clôture & audit" },
];

function getStepState(stepNum: number, currentStep: number): "done" | "active" | "pending" {
  if (stepNum < currentStep) return "done";
  if (stepNum === currentStep) return "active";
  return "pending";
}

export default function WorkflowStepper({ currentStep, statut }: WorkflowStepperProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Desktop: horizontal stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 mx-8" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-blue-500 mx-8 transition-all duration-500"
          style={{ width: `${Math.max(0, ((currentStep - 1) / 6) * 100)}%` }}
        />

        {STEPS.map((step) => {
          const state = getStepState(step.num, currentStep);
          return (
            <div key={step.num} className="flex flex-col items-center gap-2 relative z-10">
              {/* Circle */}
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  state === "done"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : state === "active"
                    ? "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-100"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {state === "done" ? "✓" : step.num}
              </div>
              {/* Label */}
              <div className="text-center">
                <div
                  className={`text-xs font-semibold ${
                    state === "active"
                      ? "text-blue-700"
                      : state === "done"
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-xs text-slate-400 hidden lg:block">{step.agent}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-3 md:hidden">
        {STEPS.map((step) => {
          const state = getStepState(step.num, currentStep);
          return (
            <div key={step.num} className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  state === "done"
                    ? "bg-blue-600 text-white"
                    : state === "active"
                    ? "bg-blue-50 border-2 border-blue-600 text-blue-700"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {state === "done" ? "✓" : step.num}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${state === "pending" ? "text-slate-400" : "text-slate-800"}`}>
                  {step.icon} {step.label}
                </div>
                <div className="text-xs text-slate-400">{step.description}</div>
              </div>
              {state === "active" && (
                <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                  En cours
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      {currentStep <= 7 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">{STEPS[currentStep - 1]?.icon}</span>
            <div>
              <span className="text-sm font-semibold text-slate-800">
                Étape actuelle : {STEPS[currentStep - 1]?.label}
              </span>
              <span className="text-sm text-slate-500 ml-2">
                — {STEPS[currentStep - 1]?.description}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}