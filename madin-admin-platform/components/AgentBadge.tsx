interface AgentBadgeProps {
  agent: string;
  model: "Opus" | "Sonnet";
  showModel?: boolean;
}

const AGENT_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  diagnostiqueur: { label: "Diagnostiqueur", emoji: "🔍", color: "bg-blue-50 text-blue-800 border-blue-200" },
  monteur: { label: "Monteur", emoji: "✍️", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
  documentaliste: { label: "Documentaliste", emoji: "📋", color: "bg-violet-50 text-violet-800 border-violet-200" },
  controleur: { label: "Contrôleur", emoji: "🔒", color: "bg-orange-50 text-orange-800 border-orange-200" },
  suiveur: { label: "Suiveur", emoji: "📡", color: "bg-teal-50 text-teal-800 border-teal-200" },
  archiviste: { label: "Archiviste", emoji: "🗄️", color: "bg-slate-50 text-slate-800 border-slate-200" },
  veilleur: { label: "Veilleur", emoji: "👁️", color: "bg-green-50 text-green-800 border-green-200" },
  ocr: { label: "OCR", emoji: "📄", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  courrier: { label: "Courrier", emoji: "✉️", color: "bg-pink-50 text-pink-800 border-pink-200" },
};

export default function AgentBadge({ agent, model, showModel = true }: AgentBadgeProps) {
  const config = AGENT_CONFIG[agent.toLowerCase()] || {
    label: agent,
    emoji: "🤖",
    color: "bg-gray-50 text-gray-800 border-gray-200",
  };

  const modelColor = model === "Opus" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700";

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${config.color}`}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
      {showModel && (
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${modelColor}`}>
          {model}
        </span>
      )}
    </div>
  );
}
