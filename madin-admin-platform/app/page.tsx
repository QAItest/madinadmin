import Link from "next/link";
import DossierCard from "@/components/DossierCard";
import AgentBadge from "@/components/AgentBadge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Dossier {
  id: number;
  porteur_slug: string;
  dispositif: string;
  nom_projet: string;
  statut: string;
  etape_courante: number;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDossiers(): Promise<Dossier[]> {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/api/dossiers/`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Agent roster (for display)
// ---------------------------------------------------------------------------

const AGENTS = [
  { name: "diagnostiqueur", label: "Diagnostiqueur", model: "Opus" as const, role: "Éligibilité & cadrage" },
  { name: "monteur", label: "Monteur", model: "Sonnet" as const, role: "Rédaction dossier" },
  { name: "documentaliste", label: "Documentaliste", model: "Sonnet" as const, role: "Pièces justificatives" },
  { name: "controleur", label: "Contrôleur", model: "Opus" as const, role: "Audit de conformité" },
  { name: "suiveur", label: "Suiveur", model: "Sonnet" as const, role: "Suivi post-dépôt" },
  { name: "archiviste", label: "Archiviste", model: "Opus" as const, role: "Reporting & archives" },
  { name: "veilleur", label: "Veilleur", model: "Opus" as const, role: "Veille appels à projets" },
  { name: "ocr", label: "OCR", model: "Sonnet" as const, role: "Extraction documents" },
  { name: "courrier", label: "Courrier", model: "Sonnet" as const, role: "Rédaction courriers" },
];

// ---------------------------------------------------------------------------
// Slash command shortcuts
// ---------------------------------------------------------------------------

const COMMANDS = [
  {
    cmd: "/diagnostic",
    desc: "Analyser l'éligibilité d'un porteur",
    color: "bg-blue-600 hover:bg-blue-700",
    usage: "/diagnostic {porteur} {description}",
  },
  {
    cmd: "/dossier-feder",
    desc: "Lancer le workflow complet FEDER",
    color: "bg-indigo-600 hover:bg-indigo-700",
    usage: "/dossier-feder {porteur} {dispositif}",
  },
  {
    cmd: "/checklist",
    desc: "Générer la checklist de pièces",
    color: "bg-violet-600 hover:bg-violet-700",
    usage: "/checklist {porteur} {dossier}",
  },
  {
    cmd: "/controle",
    desc: "Auditer la conformité d'un dossier",
    color: "bg-orange-600 hover:bg-orange-700",
    usage: "/controle {porteur} {dossier}",
  },
  {
    cmd: "/suivi",
    desc: "Mettre à jour le suivi post-dépôt",
    color: "bg-teal-600 hover:bg-teal-700",
    usage: "/suivi {porteur} {dossier}",
  },
  {
    cmd: "/archive",
    desc: "Générer rapport & dossier d'audit",
    color: "bg-slate-600 hover:bg-slate-700",
    usage: "/archive {porteur} {dossier} {periode}",
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const dossiers = await getDossiers();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Tableau de bord
          </h1>
          <p className="text-slate-500 mt-1">
            Plateforme multi-agents FEDER/FSE+ — Martinique &amp; Guadeloupe
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-700">9 agents actifs</span>
        </div>
      </div>

      {/* Slash command quick-launch */}
      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Commandes rapides Claude Code
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMMANDS.map((c) => (
            <div
              key={c.cmd}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className={`inline-block ${c.color} text-white font-mono text-sm font-bold px-2 py-1 rounded mb-2`}>
                {c.cmd}
              </div>
              <p className="text-slate-700 text-sm font-medium">{c.desc}</p>
              <p className="text-slate-400 text-xs mt-1 font-mono">{c.usage}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Dossiers en cours", value: dossiers.filter((d) => d.statut !== "archivage").length, color: "text-blue-600" },
          { label: "En diagnostic", value: dossiers.filter((d) => d.statut === "diagnostic").length, color: "text-indigo-600" },
          { label: "En montage", value: dossiers.filter((d) => d.statut === "montage" || d.statut === "controle").length, color: "text-orange-600" },
          { label: "Archivés", value: dossiers.filter((d) => d.statut === "archivage").length, color: "text-slate-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Recent dossiers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Dossiers récents</h2>
          <span className="text-sm text-slate-400">{dossiers.length} au total</span>
        </div>
        {dossiers.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-slate-500 font-medium">Aucun dossier pour l&apos;instant</p>
            <p className="text-slate-400 text-sm mt-1">
              Lancez <code className="bg-slate-100 px-1 rounded">/diagnostic</code> dans Claude Code pour commencer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {dossiers.slice(0, 9).map((d) => (
              <DossierCard key={d.id} dossier={d} />
            ))}
          </div>
        )}
      </section>

      {/* Agent roster */}
      <section>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Agents spécialisés</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Agent</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Modèle</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {AGENTS.map((agent) => (
                <tr key={agent.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <AgentBadge agent={agent.name} model={agent.model} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        agent.model === "Opus"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {agent.model === "Opus" ? "claude-opus-4-7" : "claude-sonnet-4-5"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{agent.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
