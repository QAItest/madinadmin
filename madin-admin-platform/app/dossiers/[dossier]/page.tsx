import Link from "next/link";
import WorkflowStepper from "@/components/WorkflowStepper";
import LiverableViewer from "@/components/LiverableViewer";
import AgentBadge from "@/components/AgentBadge";

interface Params {
  params: Promise<{ dossier: string }>;
}

interface Livrable {
  id: number;
  agent: string;
  type_livrable: string;
  chemin_fichier: string | null;
  version: number;
  statut: string;
}

interface Dossier {
  id: number;
  porteur_slug: string;
  dispositif: string;
  nom_projet: string;
  statut: string;
  etape_courante: number;
  livrables: Livrable[];
}

async function getDossier(id: string): Promise<Dossier | null> {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/api/dossiers/${id}`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function getConformityStatus(livrables: Livrable[]): {
  decision: string;
  color: string;
  items: { verts: number; orange: number; rouges: number };
} {
  const controle = livrables.find((l) => l.type_livrable === "rapport-conformite");
  if (!controle) return { decision: "Non audité", color: "gris", items: { verts: 0, orange: 0, rouges: 0 } };

  // In a real app, we'd read the metadata from the API
  return { decision: "En attente", color: "orange", items: { verts: 0, orange: 0, rouges: 0 } };
}

function getModelForAgent(agent: string): "Opus" | "Sonnet" {
  return ["diagnostiqueur", "controleur", "archiviste", "veilleur"].includes(agent)
    ? "Opus"
    : "Sonnet";
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  diagnostic: { label: "Diagnostic", color: "bg-blue-100 text-blue-700" },
  montage: { label: "Montage", color: "bg-indigo-100 text-indigo-700" },
  checklist: { label: "Checklist", color: "bg-violet-100 text-violet-700" },
  controle: { label: "Contrôle", color: "bg-orange-100 text-orange-700" },
  depot: { label: "Dépôt", color: "bg-yellow-100 text-yellow-700" },
  suivi: { label: "Suivi", color: "bg-teal-100 text-teal-700" },
  archivage: { label: "Archivé", color: "bg-slate-100 text-slate-700" },
};

export default async function DossierPage({ params }: Params) {
  const { dossier: dossierId } = await params;
  const dossier = await getDossier(dossierId);

  if (!dossier) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-slate-800">Dossier introuvable</h1>
        <p className="text-slate-500 mt-2">Le dossier #{dossierId} n&apos;existe pas.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const conformity = getConformityStatus(dossier.livrables);
  const statusInfo = STATUS_LABELS[dossier.statut] || { label: dossier.statut, color: "bg-slate-100 text-slate-700" };

  // Group livrables by agent
  const livrablesByAgent: Record<string, Livrable[]> = {};
  for (const liv of dossier.livrables) {
    if (!livrablesByAgent[liv.agent]) livrablesByAgent[liv.agent] = [];
    livrablesByAgent[liv.agent].push(liv);
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-700">Tableau de bord</Link>
        <span>/</span>
        <Link href={`/porteurs/${dossier.porteur_slug}`} className="hover:text-slate-700">
          {dossier.porteur_slug}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Dossier #{dossier.id}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">{dossier.dispositif}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {dossier.nom_projet}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Porteur :{" "}
              <Link
                href={`/porteurs/${dossier.porteur_slug}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {dossier.porteur_slug}
              </Link>
            </p>
          </div>

          {/* Conformity badge */}
          <div
            className={`flex-shrink-0 rounded-xl border p-4 text-center min-w-[120px] ${
              conformity.color === "vert"
                ? "border-green-200 bg-green-50"
                : conformity.color === "rouge"
                ? "border-red-200 bg-red-50"
                : conformity.color === "orange"
                ? "border-orange-200 bg-orange-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-2xl mb-1">
              {conformity.color === "vert" ? "✅" : conformity.color === "rouge" ? "❌" : "⚠️"}
            </div>
            <div className="text-xs font-semibold text-slate-700">Conformité</div>
            <div className="text-xs text-slate-500 mt-0.5">{conformity.decision}</div>
          </div>
        </div>
      </div>

      {/* Workflow stepper */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Progression du workflow</h2>
        <WorkflowStepper currentStep={dossier.etape_courante} statut={dossier.statut} />
      </section>

      {/* Livrables by agent */}
      {Object.entries(livrablesByAgent).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Livrables ({dossier.livrables.length})
          </h2>
          <div className="space-y-4">
            {Object.entries(livrablesByAgent).map(([agent, livs]) => (
              <div key={agent} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <AgentBadge agent={agent} model={getModelForAgent(agent)} />
                  <span className="text-xs text-slate-400">{livs.length} livrable{livs.length > 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {livs.map((liv) => (
                    <div key={liv.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 font-mono">
                          {liv.type_livrable}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">v{liv.version}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              liv.statut === "validé"
                                ? "bg-green-100 text-green-700"
                                : liv.statut === "brouillon"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {liv.statut}
                          </span>
                        </div>
                      </div>
                      {liv.chemin_fichier && (
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {liv.chemin_fichier}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Actions disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { cmd: `/controle ${dossier.porteur_slug} ${dossier.id}`, label: "Lancer un audit de conformité" },
            { cmd: `/checklist ${dossier.porteur_slug} ${dossier.id}`, label: "Mettre à jour la checklist" },
            { cmd: `/suivi ${dossier.porteur_slug} ${dossier.id}`, label: "Mettre à jour le suivi" },
            { cmd: `/archive ${dossier.porteur_slug} ${dossier.id} final`, label: "Générer le rapport final" },
          ].map((action) => (
            <div key={action.cmd} className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="font-medium text-slate-700">{action.label}</p>
              <p className="text-slate-400 text-xs font-mono mt-1">{action.cmd}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
