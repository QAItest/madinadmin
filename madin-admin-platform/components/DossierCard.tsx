import Link from "next/link";

interface Dossier {
  id: number;
  porteur_slug: string;
  dispositif: string;
  nom_projet: string;
  statut: string;
  etape_courante: number;
}

interface DossierCardProps {
  dossier: Dossier;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  diagnostic: { label: "Diagnostic", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  montage: { label: "Montage", color: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  checklist: { label: "Checklist", color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  controle: { label: "Contrôle", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  depot: { label: "Dépôt", color: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  suivi: { label: "Suivi", color: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  archivage: { label: "Archivé", color: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const DISPOSITIF_LABELS: Record<string, string> = {
  "feder-axe1-innovation": "FEDER — Innovation",
  "feder-axe2-numerique": "FEDER — Numérique",
  "feder-axe3-energie": "FEDER — Énergie",
  "feder-axe4-mobilite": "FEDER — Mobilité",
  "feder-axe5-urbain": "FEDER — Développement urbain",
  "fse-plus-emploi": "FSE+ — Emploi",
  "fse-plus-inclusion": "FSE+ — Inclusion",
  "fse-plus-formation": "FSE+ — Formation",
  "feampa": "FEAMPA — Pêche & Aquaculture",
  "france-2030": "France 2030 Ultramarin",
};

export default function DossierCard({ dossier }: DossierCardProps) {
  const statusInfo = STATUS_CONFIG[dossier.statut] || {
    label: dossier.statut,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  const dispositifLabel = DISPOSITIF_LABELS[dossier.dispositif] || dossier.dispositif;
  const progressPercent = Math.round(((dossier.etape_courante - 1) / 6) * 100);

  return (
    <Link href={`/dossiers/${dossier.id}`} className="block group">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 p-5 h-full">
        {/* Status badge + porteur */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
          <span className="text-xs text-slate-400 font-medium">#{dossier.id}</span>
        </div>

        {/* Project name */}
        <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-2 group-hover:text-blue-700 transition-colors line-clamp-2">
          {dossier.nom_projet}
        </h3>

        {/* Dispositif */}
        <div className="text-xs text-slate-500 mb-1">
          <span className="font-medium">Dispositif :</span>{" "}
          <span className="text-slate-600">{dispositifLabel}</span>
        </div>

        {/* Porteur */}
        <div className="text-xs text-slate-500 mb-4">
          <span className="font-medium">Porteur :</span>{" "}
          <span className="text-blue-600 hover:underline">{dossier.porteur_slug}</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Progression</span>
            <span className="text-xs font-medium text-slate-600">
              Étape {dossier.etape_courante}/7
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
