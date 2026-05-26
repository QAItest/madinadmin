import Link from "next/link";
import DossierCard from "@/components/DossierCard";
import AgentBadge from "@/components/AgentBadge";

interface Params {
  params: Promise<{ porteur: string }>;
}

interface Dossier {
  id: number;
  porteur_slug: string;
  dispositif: string;
  nom_projet: string;
  statut: string;
  etape_courante: number;
  livrables?: Livrable[];
}

interface Livrable {
  id: number;
  agent: string;
  type_livrable: string;
  chemin_fichier: string | null;
  version: number;
  statut: string;
}

async function getDossiersByPorteur(slug: string): Promise<Dossier[]> {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${backendUrl}/api/dossiers/`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const all: Dossier[] = await res.json();
    return all.filter((d) => d.porteur_slug === slug);
  } catch {
    return [];
  }
}

const STEP_LABELS = [
  "Diagnostic",
  "Montage",
  "Checklist",
  "Contrôle",
  "Dépôt",
  "Suivi",
  "Archivage",
];

function getActivityColor(agent: string): string {
  const map: Record<string, string> = {
    diagnostiqueur: "bg-blue-500",
    monteur: "bg-indigo-500",
    documentaliste: "bg-violet-500",
    controleur: "bg-orange-500",
    suiveur: "bg-teal-500",
    archiviste: "bg-slate-500",
    veilleur: "bg-green-500",
    ocr: "bg-yellow-500",
    courrier: "bg-pink-500",
  };
  return map[agent] || "bg-gray-400";
}

export default async function PorteurPage({ params }: Params) {
  const { porteur } = await params;
  const dossiers = await getDossiersByPorteur(porteur);

  // Build activity timeline from all livrables
  const allLivrables: (Livrable & { dossierId: number })[] = dossiers.flatMap((d) =>
    (d.livrables || []).map((l) => ({ ...l, dossierId: d.id }))
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-700">Tableau de bord</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">Porteur</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold">{porteur}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {porteur.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{porteur}</h1>
            <p className="text-slate-500 text-sm mt-1">Profil porteur — Martinique &amp; Guadeloupe</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}
              </span>
              <span className="text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-3 py-1">
                FEDER/FSE+ 2021-2027
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick commands for this porteur */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Commandes rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { cmd: `/diagnostic ${porteur}`, label: "Nouveau diagnostic", color: "bg-blue-600" },
            { cmd: `/dossier-feder ${porteur} feder-axe2`, label: "Dossier FEDER", color: "bg-indigo-600" },
            { cmd: `/checklist ${porteur}`, label: "Checklist pièces", color: "bg-violet-600" },
          ].map((c) => (
            <div key={c.cmd} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <span className={`text-xs ${c.color} text-white font-bold px-2 py-0.5 rounded font-mono`}>
                claude
              </span>
              <p className="text-slate-700 text-sm font-medium mt-1">{c.label}</p>
              <p className="text-slate-400 text-xs mt-0.5 font-mono truncate">{c.cmd}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dossiers */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Dossiers ({dossiers.length})
        </h2>
        {dossiers.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">Aucun dossier pour ce porteur</p>
            <p className="text-slate-400 text-sm mt-1">
              Utilisez <code className="bg-slate-100 px-1 rounded">/diagnostic {porteur}</code> pour démarrer
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dossiers.map((d) => (
              <DossierCard key={d.id} dossier={d} />
            ))}
          </div>
        )}
      </section>

      {/* Agent activity timeline */}
      {allLivrables.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Activité des agents</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="space-y-3">
              {allLivrables.map((liv) => (
                <div key={liv.id} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${getActivityColor(liv.agent)}`} />
                  <AgentBadge
                    agent={liv.agent}
                    model={["diagnostiqueur", "controleur", "archiviste", "veilleur"].includes(liv.agent) ? "Opus" : "Sonnet"}
                  />
                  <span className="text-sm text-slate-600 flex-1">{liv.type_livrable}</span>
                  <span className="text-xs text-slate-400">v{liv.version}</span>
                  <Link
                    href={`/dossiers/${liv.dossierId}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Dossier #{liv.dossierId}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
