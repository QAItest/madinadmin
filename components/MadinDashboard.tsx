"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useMemo, useState } from "react";
import type { AgentKey, DashboardData, ModuleKey } from "../lib/types";
import { useHeaderActions } from "./HeaderActionsContext";
import { MadinLogoMark } from "./MadinLogoMark";

type Props = {
  activePage?: DashboardPage;
  headerActions?: ReactNode;
  initialData: DashboardData;
};

type DashboardPage = "aides" | "demarches" | "dispositifs" | "mon-dossier" | "admin";

type NoticeKind = "success" | "info" | "warning" | "error";

type NoticeState = {
  detail?: string;
  kind: NoticeKind;
  status: number;
  title: string;
};

const agentsFinancement: Array<{ key: AgentKey; nom: string; role: string }> = [
  { key: "diagnostiqueur", nom: "Diagnostic", role: "Éligibilité" },
  { key: "monteur", nom: "Montage", role: "Rédaction" },
  { key: "documentaliste", nom: "Pièces", role: "Checklist" },
  { key: "controleur", nom: "Contrôle", role: "Conformité" },
  { key: "suiveur", nom: "Suivi", role: "Post-dépôt" },
  { key: "archiviste", nom: "Archivage", role: "Preuves" }
];

const agentsEnergie: Array<{ key: AgentKey; nom: string; role: string }> = [
  { key: "diagnostiqueur", nom: "Diagnostic énergie", role: "Besoin & usage" },
  { key: "monteur", nom: "Aides Agir Plus", role: "Simulation" },
  { key: "documentaliste", nom: "Pièces énergie", role: "Checklist" },
  { key: "controleur", nom: "Contrôle prime", role: "Éligibilité" },
  { key: "suiveur", nom: "Suivi travaux", role: "Versement" },
  { key: "archiviste", nom: "Archivage énergie", role: "Factures" }
];

const portalThemes = [
  {
    title: "Subventions FEDER",
    text: "Vérifier si le projet relève d'une mesure FEDER ouverte : innovation, transition, équipements, numérique ou développement territorial.",
    badge: "FEDER"
  },
  {
    title: "Aides Agir Plus EDF",
    text: "Identifier les primes économies d'énergie : isolation, chauffe-eau solaire, climatisation performante, LED ou brasseur d'air.",
    badge: "Agir Plus"
  },
  {
    title: "Comparer les parcours",
    text: "FEDER demande un dossier de subvention complet. Agir Plus passe souvent par un installateur partenaire et une prime déduite.",
    badge: "Orientation"
  },
  {
    title: "Suivre les pieces",
    text: "Centraliser les devis, factures, attestations, justificatifs techniques, preuves de cofinancement et demandes complémentaires.",
    badge: "Suivi"
  }
];

const permanentAidGuides = [
  {
    title: "Subvention FEDER",
    subtitle: "Financement public",
    source: "AREAD - Guide FEDER 2026",
    href: "https://www.aread.eu/2025/12/09/guide-feder-2026/",
    text:
      "Le FEDER fonctionne en cofinancement. Il peut soutenir des projets d'innovation, de transition énergétique, d'infrastructures, de mobilité durable ou de développement territorial selon les priorités régionales."
  },
  {
    title: "Agir Plus logement",
    subtitle: "Prime économie d'énergie",
    source: "EDF Martinique",
    href: "https://www.edf.mq/particulier/realiser-des-economies-d-energie/decouvrir-les-offres-edf-mq",
    text:
      "Agir Plus aide les particuliers à réduire leur consommation avec des travaux ou équipements performants : isolation, protections solaires, chauffe-eau solaire ou thermodynamique, climatisation performante, LED."
  },
  {
    title: "Agir Plus entreprise",
    subtitle: "Equipements performants",
    source: "EDF Martinique",
    href: "https://www.edf.mq/particulier/realiser-des-economies-d-energie/decouvrir-les-offres-edf-mq",
    text:
      "Certaines offres concernent aussi les professionnels : froid commercial, éclairage LED, motorisation performante, climatisation ou autres solutions d'efficacité énergétique."
  },
  {
    title: "Prime déduite",
    subtitle: "Parcours simplifie",
    source: "EDF Martinique",
    href: "https://www.edf.mq/particulier/realiser-des-economies-d-energie/decouvrir-les-offres-edf-mq",
    text:
      "EDF indique que la prime Agir Plus peut être déduite du devis et de la facture par l'installateur partenaire, ce qui évite une avance administrative complexe pour le bénéficiaire."
  }
];

const decisionTracks: Array<{
  module: ModuleKey;
  title: string;
  audience: string;
  proof: string;
  attention: string;
  cta: string;
}> = [
  {
    module: "financement",
    title: "Je finance un projet structurant",
    audience: "Entreprise, association, collectivité ou porteur de projet public.",
    proof: "Projet, budget, cofinancement, calendrier, pieces administratives.",
    attention: "Le FEDER se prépare comme un dossier complet, avec contrôle de cohérence avant dépôt.",
    cta: "Préparer un dossier FEDER"
  },
  {
    module: "energie",
    title: "Je réduis une facture d'énergie",
    audience: "Ménage, commerce, hôtel, industrie, bailleur ou collectivité.",
    proof: "Factures, devis, équipement visé, installateur, fiche technique.",
    attention: "Agir Plus depend des offres applicables et des justificatifs travaux a jour.",
    cta: "Lancer Madin'Energie"
  }
];

const pageMeta: Record<DashboardPage, { href: string; label: string; title: string; eyebrow: string }> = {
  aides: {
    href: "/aides",
    label: "Aides",
    title: "Aides permanentes",
    eyebrow: "Orientation"
  },
  demarches: {
    href: "/demarches",
    label: "Démarches",
    title: "Démarches de financement",
    eyebrow: "Parcours"
  },
  dispositifs: {
    href: "/dispositifs",
    label: "Dispositifs",
    title: "FEDER / Agir Plus",
    eyebrow: "Sources"
  },
  "mon-dossier": {
    href: "/mon-dossier",
    label: "Mon dossier",
    title: "Dossier actif",
    eyebrow: "Espace client"
  },
  admin: {
    href: "/admin",
    label: "Admin",
    title: "Pilotage des dossiers",
    eyebrow: "Supervision"
  }
};

const navItems: DashboardPage[] = ["aides", "demarches", "dispositifs", "mon-dossier", "admin"];

const readinessByModule: Record<ModuleKey, Array<{ label: string; detail: string }>> = {
  financement: [
    { label: "Projet qualifié", detail: "Objectif, territoire, bénéficiaires et calendrier." },
    { label: "Budget lisible", detail: "Dépenses, cofinancements et reste à financer." },
    { label: "Pièces contrôlées", detail: "Statuts, devis, attestations, RIB et preuves utiles." }
  ],
  energie: [
    { label: "Usage énergie", detail: "Logement, local, facture et postes de consommation." },
    { label: "Travaux ciblés", detail: "Isolation, solaire, climatisation, éclairage ou équipement." },
    { label: "Partenaire identifié", detail: "Devis, fiche technique et installateur local." }
  ]
};

function moduleLabel(module?: ModuleKey) {
  return module === "energie" ? "Madin'Énergie" : "Financement de projet";
}

function dossierStatusLabel(status: DashboardData["admin"]["dossiers"][number]["status"]) {
  if (status === "pret") return "Prêt";
  if (status === "en-cours") return "En cours";
  return "À démarrer";
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return "Non mesuré";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatNumber(value?: number) {
  if (!value) return "0";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDuration(value?: number) {
  if (!value) return "Non mesuré";
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function DonutKpi({ label, value, detail }: { label: string; value: number; detail: string }) {
  const percent = clampPercent(value);
  return (
    <div className="donut-kpi" style={{ "--donut-value": `${percent}%` } as CSSProperties}>
      <div className="donut-kpi-ring" aria-hidden="true">
        <strong>{percent}%</strong>
      </div>
      <div>
        <span>{label}</span>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function MiniBarGraph({ items }: { items: Array<{ label: string; value: number; tone?: "primary" | "success" | "warning" | "danger" }> }) {
  return (
    <div className="mini-bar-graph" aria-hidden="true">
      {items.map((item) => (
        <div className={`mini-bar-row tone-${item.tone ?? "primary"}`} key={item.label}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${clampPercent(item.value)}%` }} />
          </div>
          <strong>{clampPercent(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function runStatusLabel(status?: DashboardData["admin"]["agentKpis"][number]["lastRunStatus"]) {
  if (status === "success") return "Succès";
  if (status === "partial") return "Succès partiel";
  if (status === "fallback") return "Fallback";
  if (status === "error") return "Erreur";
  return "Non mesuré";
}

function providerLabel(provider?: string) {
  if (provider === "openai") return "OpenAI";
  if (provider === "anthropic") return "Anthropic";
  if (provider === "huggingface") return "Hugging Face";
  return "Non mesuré";
}

function providerRoleLabel(role?: string) {
  if (role === "generation") return "Génération";
  if (role === "review") return "Relecture";
  if (role === "backup") return "Backup open-source";
  return "Traitement";
}

function providerStatusLabel(status?: string) {
  if (status === "success") return "Succès";
  if (status === "fallback") return "Fallback";
  if (status === "error") return "Erreur";
  if (status === "skipped") return "Ignoré";
  return "Non mesuré";
}

function modelTierLabel(tier?: string) {
  if (tier === "premium") return "Premium";
  if (tier === "audit") return "Audit";
  if (tier === "balanced") return "Équilibré";
  if (tier === "speed") return "Rapide";
  return "Standard";
}

function effortLabel(effort?: string) {
  if (effort === "high") return "Élevé";
  if (effort === "standard") return "Standard";
  if (effort === "low") return "Bas";
  return "Standard";
}

function readableLivrableContent(content = "") {
  return content.replace(/^---[\s\S]*?---\s*/, "").trim();
}

function ProgressQuest({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "quest-loader quest-loader-compact" : "quest-loader"} role="status" aria-live="polite">
      <span className="sr-only">Préparation en cours, progression du dossier.</span>
      <span className="quest-loader-track" aria-hidden="true">
        <span className="quest-loader-fill" />
        <span className="quest-loader-step step-one" />
        <span className="quest-loader-step step-two" />
        <span className="quest-loader-step step-three" />
      </span>
      <span className="quest-loader-label" aria-hidden="true">
        <span>Progression du dossier</span>
        <strong>+ XP</strong>
      </span>
    </span>
  );
}

function noticeKindFromStatus(status: number): NoticeKind {
  if (status >= 500) return "error";
  if (status >= 400) return "warning";
  if (status >= 300) return "info";
  if (status >= 200) return "success";
  return "info";
}

function cleanErrorText(value = "") {
  return value
    .replace(/modÃ¨le/g, "modèle")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ãª/g, "ê")
    .replace(/Ã /g, "à")
    .replace(/Ã§/g, "ç")
    .replace(/\s+/g, " ")
    .trim();
}

async function readErrorDetail(response: Response) {
  const raw = await response.text();
  if (!raw) return `HTTP ${response.status}`;
  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string; detail?: string };
    return cleanErrorText(parsed.error ?? parsed.message ?? parsed.detail ?? raw);
  } catch {
    return cleanErrorText(raw.replace(/^\d+\s*-\s*/, ""));
  }
}

function errorDetail(error: unknown) {
  if (error instanceof Error) return cleanErrorText(error.message);
  return undefined;
}

export function MadinDashboard({ activePage = "aides", headerActions, initialData }: Props) {
  const contextHeaderActions = useHeaderActions();
  const resolvedHeaderActions = headerActions ?? contextHeaderActions;
  const currentPage = pageMeta[activePage] ? activePage : "aides";
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialData.selected?.id ?? "");
  const [activeLivrable, setActiveLivrable] = useState(initialData.livrables[0]?.path ?? "");
  const [busy, setBusy] = useState<string | undefined>();
  const [savingModel, setSavingModel] = useState<string | undefined>();
  const [message, setMessage] = useState<NoticeState | undefined>();
  const [showCreate, setShowCreate] = useState(
    () => !initialData.selected || (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("create") === "1")
  );
  const [portalQuery, setPortalQuery] = useState("");
  const [preferredModule, setPreferredModule] = useState<ModuleKey>(initialData.selected?.module ?? "financement");
  const [selectedDecision, setSelectedDecision] = useState<ModuleKey | undefined>();
  const [selectedProviderAgentKey, setSelectedProviderAgentKey] = useState<AgentKey | undefined>();

  const selectedLivrable = useMemo(
    () => data.livrables.find((livrable) => livrable.path === activeLivrable) ?? data.livrables[0],
    [activeLivrable, data.livrables]
  );
  const completedSteps = data.steps.filter((step) => step.status === "done").length;
  const selectedModule = data.selected?.module ?? "financement";
  const agents = selectedModule === "energie" ? agentsEnergie : agentsFinancement;
  const filteredThemes = portalThemes.filter((theme) =>
    `${theme.title} ${theme.text} ${theme.badge}`.toLowerCase().includes(portalQuery.trim().toLowerCase())
  );
  const progressPercent = Math.round((completedSteps / agents.length) * 100);
  const nextReadyStep = data.steps.find((step) => step.status === "ready");
  const nextAgent = agents.find((agent) => agent.key === nextReadyStep?.key);
  const readinessItems = readinessByModule[selectedModule];
  const accountSeed = (data.selected?.id ?? "demo-client").replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase();
  const customerAccountNumber = `MA-${accountSeed.padEnd(8, "0")}`;
  const selectedLivrableText = readableLivrableContent(selectedLivrable?.content);
  const selectedProviderAgent = data.admin.agentKpis.find((agent) => agent.key === selectedProviderAgentKey);
  const runningAgentKpi = data.admin.agentKpis.find((agent) => agent.key === busy);

  useEffect(() => {
    if (!message) return;
    if (message.kind === "warning" || message.kind === "error") return;
    const timeout = window.setTimeout(() => setMessage(undefined), 4200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!selectedProviderAgentKey) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedProviderAgentKey(undefined);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedProviderAgentKey]);

  function startTrack(module: ModuleKey) {
    setSelectedDecision(module);
    setPreferredModule(module);
    setShowCreate(true);
  }

  function notify(next: Omit<NoticeState, "kind"> & { kind?: NoticeKind }) {
    setMessage({ ...next, kind: next.kind ?? noticeKindFromStatus(next.status) });
  }

  async function refresh(porteurId = selectedId) {
    const response = await fetch(`/api/porteurs?selected=${encodeURIComponent(porteurId)}`, { cache: "no-store" });
    const next = (await response.json()) as DashboardData;
    setData(next);
    setSelectedId(next.selected?.id ?? "");
    setActiveLivrable(next.livrables[0]?.path ?? "");
  }

  async function createPorteur(formData: FormData) {
    setBusy("create");
    setMessage(undefined);
    try {
      const fields = Object.fromEntries(formData);
      const module = fields.module === "energie" ? "energie" : "financement";
      const dispositif = module === "energie" ? "Madin'Énergie - EDF Agir Plus" : "FEDER";
      const response = await fetch("/api/porteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          name: fields.name,
          structure: fields.structure,
          dispositif,
          budget: fields.budget,
          territory: "Martinique",
          deadline: "",
          project:
            module === "energie"
              ? `Diagnostic énergie et aides EDF Agir Plus pour ${fields.name}`
              : `Dossier FEDER pour ${fields.name}`
        })
      });
      if (!response.ok) throw new Error(await readErrorDetail(response));
      const created = await response.json();
      await refresh(created.id);
      setShowCreate(false);
      notify({ status: 201, title: "Dossier créé", detail: "Vous pouvez lancer la préparation du dossier." });
    } catch (error) {
      notify({ status: 500, title: "Création impossible", detail: errorDetail(error) });
    } finally {
      setBusy(undefined);
    }
  }

  async function runStep(agent: AgentKey) {
    if (!selectedId) return;
    setBusy(agent);
    setMessage(undefined);
    try {
      const response = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porteurId: selectedId, agent })
      });
      if (!response.ok) throw new Error(await readErrorDetail(response));
      const livrable = await response.json();
      await refresh(selectedId);
      setActiveLivrable(livrable.path);
      notify({ status: 200, title: "Livrable généré", detail: livrable.title });
    } catch (error) {
      notify({ status: 500, title: "Génération impossible", detail: errorDetail(error) });
    } finally {
      setBusy(undefined);
    }
  }

  async function runAll() {
    for (const step of data.steps) {
      if (step.status === "pending") break;
      await runStep(step.key);
    }
  }

  async function saveAgentModel(agent: AgentKey, patch: Record<string, string>) {
    setSavingModel(`${agent}-${Object.keys(patch)[0]}`);
    setMessage(undefined);
    try {
      const response = await fetch("/api/admin/model-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, ...patch })
      });
      if (!response.ok) throw new Error(await readErrorDetail(response));
      await refresh(selectedId);
      notify({ status: 200, title: "Routage modèle mis à jour", detail: "La prochaine exécution utilisera cette affectation." });
    } catch (error) {
      notify({ status: 500, title: "Mise à jour impossible", detail: errorDetail(error) });
    } finally {
      setSavingModel(undefined);
    }
  }

  return (
    <main className={`mvp-shell module-${selectedModule}`}>
      <a className="skip-link" href={currentPage === "mon-dossier" ? "#livrables-panel" : "#main-content"}>
        Aller au contenu
      </a>
      <header className="site-header" aria-label="En-tête du site">
        <div className="site-header-main">
          <div className="site-header-identity">
            <Link className="site-logo" href="/aides" aria-label="Accueil Madin'Admin">
              <MadinLogoMark />
              <span className="site-logo-text">
                <strong>Madin'Admin</strong>
                <span>FEDER - Agir Plus</span>
              </span>
            </Link>
            <div className="account-chip" aria-label={`Numéro de compte client ${customerAccountNumber}`}>
              <span>Compte client</span>
              <strong>{customerAccountNumber}</strong>
            </div>
          </div>
          <div className="site-header-actions">
            {resolvedHeaderActions ? (
              <div className="site-header-tools" aria-label="Session et preferences">
                {resolvedHeaderActions}
              </div>
            ) : null}
            <form className="site-search" role="search" onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="header-aid-search">
                Rechercher une aide
              </label>
              <input
                id="header-aid-search"
                type="search"
                value={portalQuery}
                onChange={(event) => setPortalQuery(event.currentTarget.value)}
                placeholder="Rechercher une aide"
              />
            </form>
          </div>
        </div>
        <nav className="site-nav site-header-navrow" aria-label="Navigation rapide">
          {navItems.map((item) => (
            <Link className={currentPage === item ? "active" : ""} href={pageMeta[item].href} key={item} aria-current={currentPage === item ? "page" : undefined}>
              {pageMeta[item].label}
            </Link>
          ))}
        </nav>
      </header>

      {message ? (
        <div className={`notice notice-${message.kind}`} role={message.kind === "error" || message.kind === "warning" ? "alert" : "status"} aria-live={message.kind === "error" || message.kind === "warning" ? "assertive" : "polite"} aria-atomic="true">
          <span className="notice-icon" aria-hidden="true">
            {message.kind === "success" ? "✓" : message.kind === "info" ? "i" : message.kind === "warning" ? "!" : "×"}
          </span>
          <div className="notice-copy">
            <div>
              <strong>{message.title}</strong>
              <span>HTTP {message.status}</span>
            </div>
            {message.detail ? <p>{message.detail}</p> : null}
          </div>
          <button className="notice-close" type="button" onClick={() => setMessage(undefined)} aria-label="Fermer la notification">
            ×
          </button>
        </div>
      ) : null}

      <div className="page-content" id="main-content" key={currentPage}>
      {currentPage === "aides" ? (
      <section className="portal-hero" aria-labelledby="portal-title">
        <div className="portal-hero-copy">
          <span>Service en ligne</span>
          <h1 id="portal-title">Subventions FEDER et aides Agir Plus</h1>
          <p>
            Un parcours unique pour orienter le porteur vers le bon financement : dossier FEDER pour les projets structurants, prime Agir Plus pour les économies d'énergie.
          </p>
          <div className="portal-actions">
            <button type="button" onClick={() => setShowCreate(true)}>
              Commencer ma démarche
            </button>
            <Link className="text-link" href="/dispositifs">
              Voir les dispositifs
            </Link>
          </div>
        </div>
        <aside className="portal-search" aria-label="Progression du dossier">
          <section className="progress-panel" aria-labelledby="progress-title">
            <div className="progress-panel-head">
              <span id="progress-title">Preparation du dossier</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div
              className="progress-meter"
              role="progressbar"
              aria-label="Progression de la préparation du dossier"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <p>
              {completedSteps === agents.length
                ? "Le parcours est complet. Les livrables peuvent être relus et archivés."
                : nextAgent
                  ? `Prochaine action : ${nextAgent.nom}.`
                  : "Créez ou sélectionnez un dossier pour démarrer le diagnostic."}
            </p>
            <div className="achievement-row" aria-label="Jalons du dossier">
              <span className={completedSteps >= 1 ? "earned" : ""}>Diagnostic</span>
              <span className={completedSteps >= 3 ? "earned" : ""}>Pièces</span>
              <span className={completedSteps >= agents.length ? "earned" : ""}>Prêt</span>
            </div>
          </section>
        </aside>
      </section>
      ) : null}

      {currentPage === "aides" ? (
      <section className="decision-section" aria-labelledby="decision-title">
        <div className="section-kicker">
          <span>Orientation</span>
          <h2 id="decision-title">Choisir le bon parcours en moins de 2 minutes</h2>
        </div>
        <div className="decision-grid">
          {decisionTracks.map((track) => (
            <article className={`decision-card decision-card-light ${track.module === selectedDecision ? "active" : ""}`} key={track.module}>
              <div>
                <span>{track.module === "energie" ? "Agir Plus" : "FEDER"}</span>
                <h3>{track.title}</h3>
                <p>{track.audience}</p>
              </div>
              <dl>
                <div>
                  <dt>À préparer</dt>
                  <dd>{track.proof}</dd>
                </div>
                <div>
                  <dt>Point de vigilance</dt>
                  <dd>{track.attention}</dd>
                </div>
              </dl>
              <button type="button" onClick={() => startTrack(track.module)}>
                {track.cta}
              </button>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {currentPage === "aides" ? (
      <section className="portal-section" id="themes" aria-labelledby="themes-title">
        <div className="section-kicker">
          <span>Vous souhaitez</span>
          <h2 id="themes-title">Choisir entre FEDER et Agir Plus</h2>
        </div>
        <div className="theme-grid">
          {(filteredThemes.length > 0 ? filteredThemes : portalThemes).map((theme) => (
            <article className="theme-card" key={theme.title}>
              <span>{theme.badge}</span>
              <h3>{theme.title}</h3>
              <p>{theme.text}</p>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {currentPage === "demarches" ? (
      <section className="secure-workspace" id="demarches" aria-labelledby="demarches-title">
        <div>
          <span>Espace sécurisé</span>
          <h2 id="demarches-title">Vos démarches de financement</h2>
          <p>
            Le diagnostic distingue les subventions FEDER, qui exigent un dossier complet, des aides Agir Plus, qui passent par des travaux éligibles et des partenaires installateurs.
          </p>
        </div>
        <div className="service-list">
          <button type="button" onClick={() => setShowCreate(true)}>
            Creer une demande
          </button>
          <button type="button" onClick={() => runStep("diagnostiqueur")} disabled={!selectedId || Boolean(busy)}>
            Vérifier l'éligibilité
          </button>
          <button type="button" onClick={runAll} disabled={!selectedId || Boolean(busy)}>
            Continuer la préparation
          </button>
        </div>
      </section>
      ) : null}

      {currentPage === "demarches" ? (
      <section className="readiness-panel" aria-labelledby="readiness-title">
        <div className="section-kicker">
          <span>Preparation</span>
              <h2 id="readiness-title">Avant de préparer le dossier</h2>
        </div>
        <ol>
          {readinessItems.map((item, index) => (
            <li key={item.label}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      ) : null}

      {currentPage === "dispositifs" ? (
      <section className="fund-guides" id="permanentes" aria-labelledby="funds-title">
        <div className="section-kicker">
          <span>Dispositifs</span>
          <h2 id="funds-title">Comprendre FEDER et Agir Plus</h2>
        </div>
        <div className="fund-grid">
          {permanentAidGuides.map((guide) => (
            <article className="fund-card" key={guide.title}>
              <span>{guide.subtitle}</span>
              <h3>{guide.title}</h3>
              <p>{guide.text}</p>
              <a href={guide.href} target="_blank" rel="noreferrer" aria-label={`Source ${guide.source}, ouvre dans un nouvel onglet`}>
                Source : {guide.source} <span className="sr-only">(ouvre dans un nouvel onglet)</span>
              </a>
            </article>
          ))}
        </div>
      </section>
      ) : null}

      {currentPage === "mon-dossier" && showCreate ? (
        <section className="create-card" aria-labelledby="create-title">
          <div className="create-card-head">
            <h1 id="create-title">Créer un nouveau dossier</h1>
            {data.porteurs.length > 0 ? (
              <button className="return-link" type="button" onClick={() => setShowCreate(false)}>
                <span aria-hidden="true">←</span>
                {" "}
                Revenir au dossier actif
              </button>
            ) : null}
          </div>
          <form
            key={preferredModule}
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              createPorteur(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <label>
              Module
              <select name="module" defaultValue={preferredModule}>
                <option value="financement">Financement de projet</option>
                <option value="energie">Madin'Énergie - aides EDF Agir Plus</option>
              </select>
              <span className="field-hint">Ce choix adapte les contrôles, les pièces demandées et le type de livrable.</span>
            </label>
            <label>
              Nom du porteur
              <input name="name" required placeholder="ex: Residence Les Alizes" />
              <span className="field-hint">Utilisez le nom officiel du bénéficiaire ou de la structure.</span>
            </label>
            <label>
              Type de structure
              <select name="structure" defaultValue="TPE">
                <option>TPE</option>
                <option>PME</option>
                <option>Association loi 1901</option>
                <option>Collectivité territoriale</option>
                <option>Ménage</option>
                <option>Hotel / commerce</option>
                <option>Bailleur social</option>
                <option>Installateur partenaire</option>
                <option>SCIC</option>
              </select>
            </label>
            <label>
              Budget ou estimation travaux
              <input name="budget" required placeholder="ex: 150000" type="number" />
              <span className="field-hint">Montant indicatif uniquement, les aides seront vérifiées avant conclusion.</span>
            </label>
            <fieldset className="compliance-fieldset">
              <legend>Engagements de conformité</legend>
              <label>
                <input name="accuracy" required type="checkbox" />
                Les informations saisies sont exactes au meilleur de ma connaissance.
              </label>
              <label>
                <input name="document-consent" required type="checkbox" />
                J'autorise l'utilisation des pièces transmises pour préparer et suivre ce dossier.
              </label>
              <label>
                <input name="no-auto-submit" required type="checkbox" />
                Je reconnais que Madin'Admin ne dépose pas le dossier et ne signe aucun document à ma place.
              </label>
            </fieldset>
            <section className="create-compliance" aria-labelledby="create-compliance-title">
              <h2 id="create-compliance-title">Points de conformité à vérifier</h2>
              <ul>
                <li>
                  <strong>Finalité.</strong> Les données servent uniquement à l'orientation, la préparation, le suivi et l'archivage du dossier.
                </li>
                <li>
                  <strong>Justificatifs.</strong> Les montants, critères et statuts doivent être confirmés par des pièces officielles ou des fiches dispositif à jour.
                </li>
                <li>
                  <strong>Droits du porteur.</strong> Le porteur peut demander l'accès, la correction ou la suppression des données applicables.
                </li>
                <li>
                  <strong>Conservation.</strong> Les pièces sont conservées seulement pendant la durée utile à l'instruction, au contrôle ou à l'archivage réglementaire.
                </li>
              </ul>
            </section>
            <button type="submit" disabled={busy === "create"} aria-busy={busy === "create"}>
              {busy === "create" ? <ProgressQuest compact /> : "Lancer la préparation du dossier"}
            </button>
          </form>
        </section>
      ) : currentPage === "mon-dossier" ? (
        <section className="mvp-dossier" id="dossier-actif" aria-label="Dossier actif">
          <div className="dossier-card">
            <div className="dossier-card-head">
              <div>
                <h1>{data.selected?.name ?? "Aucun dossier"}</h1>
                <p>
                  ID: {data.selected?.id ?? "-"} - Créé:{" "}
                  {data.selected ? new Date(data.selected.createdAt).toLocaleDateString("fr-FR") : "-"}
                </p>
              </div>
              <div className={completedSteps === agents.length ? "dossier-status complete" : "dossier-status"}>
                {completedSteps === agents.length ? "Complet" : "En cours"}
              </div>
            </div>

            <div className="dossier-meta">
              <div>
                <span>Structure:</span> {data.selected?.structure ?? "-"}
              </div>
              <div>
                <span>Module:</span> {moduleLabel(selectedModule)}
              </div>
              <div>
                <span>Dispositif:</span> {data.selected?.dispositif ?? "FEDER"}
              </div>
              <div>
                <span>Budget:</span> {data.selected?.budget ?? "-"}
              </div>
              <div>
                <span>Étapes:</span> {completedSteps} / {agents.length}
              </div>
            </div>
          </div>

          <div className="agent-timeline" aria-label="Étapes de préparation du dossier">
            {agents.map((agent, index) => {
              const step = data.steps.find((item) => item.key === agent.key);
              const isComplete = step?.status === "done";
              const isCurrent = busy === agent.key;
              return (
                <button
                  className={`agent-node ${isComplete ? "done" : ""} ${step?.status === "ready" ? "ready" : ""} ${isCurrent ? "running" : ""}`}
                  disabled={!selectedId || step?.status === "pending" || Boolean(busy)}
                  data-status={step?.status ?? "pending"}
                  key={agent.key}
                  onClick={() => runStep(agent.key)}
                  aria-label={`${agent.nom}, ${agent.role}, statut ${step?.status ?? "pending"}`}
                  type="button"
                >
                  <span className="agent-index">{index + 1}</span>
                  <strong>{agent.nom}</strong>
                  <small>{agent.role}</small>
                  {isComplete ? <em>OK</em> : null}
                </button>
              );
            })}
          </div>

          {runningAgentKpi ? (
            <section className="live-model-route" aria-label="Routage en cours" aria-live="polite">
              <div className="live-model-route-head">
                <span>Traitement en cours</span>
                <strong>{runningAgentKpi.title}</strong>
              </div>
              <ol>
                <li className="active">
                  <span>1</span>
                  <div>
                    <strong>Moteur principal choisi</strong>
                    <p>{runningAgentKpi.primaryModelName} · {providerLabel(runningAgentKpi.primaryProvider)} · {runningAgentKpi.primaryModel}</p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>Relais automatique si indisponible</strong>
                    <p>{runningAgentKpi.backupModelName} · {providerLabel(runningAgentKpi.backupProvider)} · {runningAgentKpi.backupModel}</p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <strong>Relecture prévue</strong>
                    <p>{runningAgentKpi.reviewModelName} · {providerLabel(runningAgentKpi.reviewProvider)} · {runningAgentKpi.reviewModel}</p>
                  </div>
                </li>
              </ol>
            </section>
          ) : null}

          {completedSteps === 0 ? (
            <div className="center-action">
              <button disabled={Boolean(busy)} onClick={() => runStep("diagnostiqueur")} type="button" aria-busy={Boolean(busy)}>
                {busy ? <ProgressQuest compact /> : "Lancer le diagnostic du dossier"}
              </button>
            </div>
          ) : null}

          <div className="livrable-workbench">
            <section className="journal">
              <div className="section-title">
                <h2>Journal de progression - {completedSteps} étape(s) traitée(s)</h2>
              </div>
              <div className="journal-list">
                {data.livrables.length === 0 ? <p>Aucun livrable pour l'instant.</p> : null}
                {data.livrables.map((livrable) => (
                  <button
                    className={selectedLivrable?.path === livrable.path ? "journal-item active" : "journal-item"}
                    aria-current={selectedLivrable?.path === livrable.path ? "true" : undefined}
                    key={livrable.path}
                    onClick={() => setActiveLivrable(livrable.path)}
                    type="button"
                  >
                    <span>{livrable.title}</span>
                    <small>{readableLivrableContent(livrable.content).slice(0, 90).replace(/\s+/g, " ")}...</small>
                    <em>{new Date(livrable.createdAt).toLocaleTimeString("fr-FR")}</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="livrables" id="livrables-panel">
              <div className="section-title">
                <h2>{selectedLivrable ? `${selectedLivrable.title} - Livrable` : "Sélectionnez un livrable"}</h2>
              </div>
              <pre>{selectedLivrableText || "Aucun livrable sélectionné."}</pre>
            </section>
          </div>

          <div className="footer-actions">
            <button className="ghost-button" type="button" onClick={() => setShowCreate(true)}>
              Créer un nouveau dossier
            </button>
            <button disabled={Boolean(busy)} onClick={runAll} type="button" aria-busy={Boolean(busy)}>
              {busy ? <ProgressQuest compact /> : "Continuer la préparation"}
            </button>
          </div>
        </section>
      ) : null}

      {currentPage === "admin" ? (
        <section className="admin-page" aria-labelledby="admin-title">
          <div className="admin-hero">
            <div>
              <span>Console administrateur</span>
              <h1 id="admin-title">Pilotage des dossiers en cours</h1>
              <p>
                Suivez l'ensemble des dossiers FEDER et Agir Plus, identifiez les prochaines actions et mesurez la performance
                opérationnelle des agents de traitement.
              </p>
            </div>
            <Link className="text-link" href="/mon-dossier">
              Ouvrir le dossier actif
            </Link>
          </div>

          <div className="admin-kpi-grid" aria-label="Indicateurs globaux">
            <article className="admin-kpi-card">
              <span>Dossiers suivis</span>
              <strong>{data.admin.totals.dossiers}</strong>
              <p>{data.admin.totals.inProgress} en cours</p>
              <MiniBarGraph
                items={[
                  {
                    label: "En cours",
                    value: data.admin.totals.dossiers > 0 ? (data.admin.totals.inProgress / data.admin.totals.dossiers) * 100 : 0
                  },
                  {
                    label: "Prêts",
                    value: data.admin.totals.dossiers > 0 ? (data.admin.totals.ready / data.admin.totals.dossiers) * 100 : 0,
                    tone: "success"
                  }
                ]}
              />
            </article>
            <article className="admin-kpi-card">
              <span>Prêts à relire</span>
              <strong>{data.admin.totals.ready}</strong>
              <p>{data.admin.totals.notStarted} à démarrer</p>
              <DonutKpi
                label="Taux de dossiers prêts"
                value={data.admin.totals.dossiers > 0 ? (data.admin.totals.ready / data.admin.totals.dossiers) * 100 : 0}
                detail="Part des dossiers complets"
              />
            </article>
            <article className="admin-kpi-card">
              <span>Progression moyenne</span>
              <strong>{data.admin.totals.averageProgress}%</strong>
              <div className="kpi-meter" aria-hidden="true">
                <span style={{ width: `${data.admin.totals.averageProgress}%` }} />
              </div>
              <DonutKpi label="Maturité moyenne" value={data.admin.totals.averageProgress} detail="Avancement tous dossiers" />
            </article>
            <article className="admin-kpi-card">
              <span>Livrables produits</span>
              <strong>{data.admin.totals.livrables}</strong>
              <p>{data.admin.agentKpis.length} agents mesurés</p>
              <MiniBarGraph
                items={data.admin.agentKpis.slice(0, 4).map((agent) => ({
                  label: agent.title.replace("Diagnostic d'éligibilité", "Diagnostic").replace("Montage du dossier", "Montage"),
                  value: agent.completionRate,
                  tone: agent.completionRate >= 100 ? "success" : agent.completionRate >= 50 ? "primary" : "warning"
                }))}
              />
            </article>
          </div>

          <section className="admin-table-card" aria-labelledby="admin-dossiers-title">
            <div className="admin-section-head">
              <div>
                <span>Dossiers</span>
                <h2 id="admin-dossiers-title">Vue complète des demandes</h2>
              </div>
              <Link className="admin-action-link" href="/mon-dossier?create=1">
                Nouveau dossier
              </Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-dossier-table">
                <thead>
                  <tr>
                    <th scope="col">Dossier</th>
                    <th scope="col">Module</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Progression</th>
                    <th scope="col">Prochaine action</th>
                    <th scope="col">Mise à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {data.admin.dossiers.length === 0 ? (
                    <tr>
                      <td colSpan={6}>Aucun dossier enregistré pour le moment.</td>
                    </tr>
                  ) : null}
                  {data.admin.dossiers.map((dossier) => (
                    <tr key={dossier.id}>
                      <td>
                        <strong>{dossier.name}</strong>
                        <span>{dossier.structure} - {dossier.dispositif}</span>
                      </td>
                      <td>{moduleLabel(dossier.module)}</td>
                      <td>
                        <span className={`admin-status admin-status-${dossier.status}`}>{dossierStatusLabel(dossier.status)}</span>
                      </td>
                      <td>
                        <div className="table-progress">
                          <span style={{ width: `${dossier.progress}%` }} />
                        </div>
                        <em>{dossier.completedSteps}/{dossier.totalSteps}</em>
                      </td>
                      <td>{dossier.nextStepTitle ?? "Relire et archiver"}</td>
                      <td>{formatDate(dossier.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="agent-kpi-section" aria-labelledby="agent-kpi-title">
            <div className="admin-section-head">
              <div>
                <span>Performance</span>
                <h2 id="agent-kpi-title">KPI par agent de traitement</h2>
              </div>
            </div>
            <div className="agent-kpi-grid">
              {data.admin.agentKpis.map((agent) => (
                <article className="agent-kpi-card" key={agent.key}>
                  <div className="agent-kpi-head">
                    <div>
                      <span>{agent.folder}</span>
                      <h3>{agent.title}</h3>
                    </div>
                    <strong>{agent.completionRate}%</strong>
                  </div>
                  <section className="model-strategy" aria-label={`Stratégie modèle pour ${agent.title}`}>
                    <div>
                      <span>Routage optimisé</span>
                      <strong>{modelTierLabel(agent.modelTier)}</strong>
                      <em>Effort {effortLabel(agent.modelEffort)}</em>
                    </div>
                    <div className="model-score-grid">
                      <div>
                        <span>Qualité</span>
                        <strong>{agent.qualityScore}</strong>
                      </div>
                      <div>
                        <span>Temps</span>
                        <strong>{agent.speedScore}</strong>
                      </div>
                      <div>
                        <span>Gain</span>
                        <strong>{agent.gainScore}</strong>
                      </div>
                    </div>
                    <p>{agent.modelRationale}</p>
                  </section>
                  <section className="model-assignment-panel" aria-label={`Affectation des modèles pour ${agent.title}`}>
                    <label>
                      Modèle principal
                      <select
                        value={agent.primaryModel}
                        disabled={Boolean(savingModel)}
                        onChange={(event) => saveAgentModel(agent.key, { openaiModel: event.currentTarget.value })}
                      >
                        {data.admin.modelOptions.openai.map((model) => (
                          <option key={`${agent.key}-openai-${model}`} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <em>{agent.primaryModelName}</em>
                    </label>
                    <label>
                      Relecture
                      <select
                        value={agent.reviewModel}
                        disabled={Boolean(savingModel)}
                        onChange={(event) => saveAgentModel(agent.key, { anthropicReviewModel: event.currentTarget.value })}
                      >
                        {data.admin.modelOptions.anthropic.map((model) => (
                          <option key={`${agent.key}-anthropic-${model}`} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <em>{agent.reviewModelName}</em>
                    </label>
                    <label>
                      Backup open-source
                      <select
                        value={agent.backupModel}
                        disabled={Boolean(savingModel)}
                        onChange={(event) => saveAgentModel(agent.key, { openSourceBackupModel: event.currentTarget.value })}
                      >
                        {data.admin.modelOptions.openSource.map((model) => (
                          <option key={`${agent.key}-opensource-${model}`} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <em>{agent.backupModelName}</em>
                    </label>
                    <label>
                      Effort
                      <select
                        value={agent.modelEffort}
                        disabled={Boolean(savingModel)}
                        onChange={(event) => saveAgentModel(agent.key, { effort: event.currentTarget.value })}
                      >
                        <option value="low">Bas</option>
                        <option value="standard">Standard</option>
                        <option value="high">Élevé</option>
                      </select>
                    </label>
                  </section>
                  <div className="agent-visual-grid" aria-label={`Graphiques de performance pour ${agent.title}`}>
                    <DonutKpi label="Complétion" value={agent.completionRate} detail={`${agent.completedDossiers}/${data.admin.totals.dossiers} dossiers`} />
                    <MiniBarGraph
                      items={[
                        { label: "Qualité", value: agent.qualityScore, tone: "success" },
                        { label: "Temps", value: agent.speedScore, tone: "primary" },
                        { label: "Gain", value: agent.gainScore, tone: "warning" }
                      ]}
                    />
                  </div>
                  <div className="kpi-meter" aria-label={`Taux de complétion ${agent.completionRate}%`}>
                    <span style={{ width: `${agent.completionRate}%` }} />
                  </div>
                  <dl className="agent-metric-strip">
                    <div>
                      <dt>Livrables</dt>
                      <dd>{agent.totalLivrables}</dd>
                    </div>
                    <div>
                      <dt>Prêts</dt>
                      <dd>{agent.readyDossiers}</dd>
                    </div>
                    <div>
                      <dt>Attente</dt>
                      <dd>{agent.pendingDossiers}</dd>
                    </div>
                    <div>
                      <dt>Runs</dt>
                      <dd>{agent.runCount}</dd>
                    </div>
                    <div>
                      <dt>Tokens</dt>
                      <dd>{formatNumber(agent.totalTokens)}</dd>
                    </div>
                    <div>
                      <dt>Durée</dt>
                      <dd>{formatDuration(agent.averageDurationMs)}</dd>
                    </div>
                  </dl>
                  <p className="agent-last-run">
                    Sortie : {formatDateTime(agent.lastOutputAt)} · Run : {formatDateTime(agent.lastRunAt)} · Statut : {runStatusLabel(agent.lastRunStatus)}
                  </p>
                  <button className="agent-detail-trigger" type="button" onClick={() => setSelectedProviderAgentKey(agent.key)}>
                    <span>Détails fournisseurs et tokens</span>
                    <em>{agent.providerBreakdown.length} sources</em>
                  </button>
                </article>
              ))}
            </div>
          </section>
        </section>
      ) : null}
      </div>
      {selectedProviderAgent ? (
        <div className="agent-detail-overlay" role="presentation" onClick={() => setSelectedProviderAgentKey(undefined)}>
          <aside
            className="agent-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="agent-detail-panel-head">
              <div>
                <span>Fournisseurs et tokens</span>
                <h2 id="agent-detail-title">{selectedProviderAgent.title}</h2>
                <p>
                  {selectedProviderAgent.providerBreakdown.length} sources · {formatNumber(selectedProviderAgent.totalTokens)} tokens ·{" "}
                  {formatDuration(selectedProviderAgent.averageDurationMs)}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedProviderAgentKey(undefined)} aria-label="Fermer les détails fournisseurs">
                ×
              </button>
            </div>
            <div className="provider-kpi-stack" aria-label={`Détail fournisseurs pour ${selectedProviderAgent.title}`}>
              {selectedProviderAgent.providerBreakdown.map((provider) => (
                <section className="provider-kpi" key={`${selectedProviderAgent.key}-${provider.provider}-${provider.role}`}>
                  <div>
                    <span>{providerRoleLabel(provider.role)}</span>
                    <strong>{providerLabel(provider.provider)}</strong>
                    <b>{provider.modelName}</b>
                    <em>{provider.model}</em>
                  </div>
                  <dl>
                    <div>
                      <dt>Runs</dt>
                      <dd>{provider.runCount}</dd>
                    </div>
                    <div>
                      <dt>Succès / erreurs</dt>
                      <dd>{provider.successCount} / {provider.errorCount}</dd>
                    </div>
                    <div>
                      <dt>Tokens</dt>
                      <dd>{formatNumber(provider.totalTokens)}</dd>
                    </div>
                    <div>
                      <dt>Durée</dt>
                      <dd>{formatDuration(provider.averageDurationMs)}</dd>
                    </div>
                  </dl>
                  <p>Dernier appel : {formatDateTime(provider.lastRunAt)}</p>
                </section>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
      <footer className="site-footer">
        <div>
          <strong>Madin'Admin</strong>
          <p>Assistant de préparation et de suivi pour subventions FEDER et aides Agir Plus. Les dépôts, signatures et engagements restent effectués par le porteur.</p>
        </div>
        <nav aria-labelledby="footer-portal">
          <h2 id="footer-portal">Portail</h2>
          <Link href="/aides">Aides disponibles</Link>
          <Link href="/demarches">Démarches</Link>
          <Link href="/dispositifs">Sources dispositifs</Link>
          <Link href="/mon-dossier">Livrables</Link>
          <Link href="/admin">Administration</Link>
        </nav>
        <nav aria-labelledby="footer-data">
          <h2 id="footer-data">Données</h2>
          <a href="#confidentialite">Confidentialité</a>
          <a href="#retention">Conservation limitée</a>
          <a href="#suppression">Suppression des données</a>
        </nav>
        <section className="compliance-note" aria-label="Informations de conformité">
          <h2 id="confidentialite">Confidentialité et conservation</h2>
          <ul>
            <li>
              <strong>Cloisonnement.</strong> Les données de dossier restent séparées par porteur, module et finalité.
            </li>
            <li id="retention">
              <strong>Conservation limitée.</strong> La durée de conservation doit correspondre au besoin d'instruction, de contrôle ou d'archivage.
            </li>
            <li id="suppression">
              <strong>Droits du porteur.</strong> L'utilisateur doit pouvoir demander l'accès, la correction ou la suppression des données applicables.
            </li>
          </ul>
        </section>
        <small>Informations indicatives à vérifier avec les fiches officielles et les organismes gestionnaires.</small>
      </footer>
      <nav className="mobile-bottom-nav" aria-label="Navigation mobile principale">
        <Link className={currentPage === "aides" ? "active" : ""} href="/aides">Aides</Link>
        <Link className={currentPage === "demarches" ? "active" : ""} href="/demarches">Démarches</Link>
        <Link className={currentPage === "dispositifs" ? "active" : ""} href="/dispositifs">Sources</Link>
        <Link className={currentPage === "mon-dossier" ? "active" : ""} href="/mon-dossier">Dossier</Link>
        <Link className={currentPage === "admin" ? "active" : ""} href="/admin">Admin</Link>
      </nav>
    </main>
  );
}
