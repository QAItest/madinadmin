"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import type { AgentKey, DashboardData, ModuleKey } from "../lib/types";
import { useHeaderActions } from "./HeaderActionsContext";
import { MadinLogoMark } from "./MadinLogoMark";

type Props = {
  activePage?: DashboardPage;
  headerActions?: ReactNode;
  initialData: DashboardData;
};

type DashboardPage = "aides" | "demarches" | "dispositifs" | "mon-dossier";

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
  }
};

const navItems: DashboardPage[] = ["aides", "demarches", "dispositifs", "mon-dossier"];

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

function readableLivrableContent(content = "") {
  return content.replace(/^---[\s\S]*?---\s*/, "").trim();
}

export function MadinDashboard({ activePage = "aides", headerActions, initialData }: Props) {
  const contextHeaderActions = useHeaderActions();
  const resolvedHeaderActions = headerActions ?? contextHeaderActions;
  const currentPage = pageMeta[activePage] ? activePage : "aides";
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialData.selected?.id ?? "");
  const [activeLivrable, setActiveLivrable] = useState(initialData.livrables[0]?.path ?? "");
  const [busy, setBusy] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(!initialData.selected);
  const [portalQuery, setPortalQuery] = useState("");
  const [preferredModule, setPreferredModule] = useState<ModuleKey>(initialData.selected?.module ?? "financement");
  const [selectedDecision, setSelectedDecision] = useState<ModuleKey | undefined>();

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

  function startTrack(module: ModuleKey) {
    setSelectedDecision(module);
    setPreferredModule(module);
    setShowCreate(true);
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
      if (!response.ok) throw new Error(await response.text());
      const created = await response.json();
      await refresh(created.id);
      setShowCreate(false);
      setMessage("Dossier créé. Lancez la préparation du dossier.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Création impossible.");
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
      if (!response.ok) throw new Error(await response.text());
      const livrable = await response.json();
      await refresh(selectedId);
      setActiveLivrable(livrable.path);
      setMessage(`${livrable.title} généré.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generation impossible.");
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
        <div className="notice" role="status" aria-live="polite" aria-atomic="true">
          {message}
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

      {currentPage === "dispositifs" ? (
      <section className="ops-panel" aria-labelledby="ops-title">
        <div className="section-kicker">
          <span>Socle de production</span>
          <h2 id="ops-title">Services connectés au parcours</h2>
        </div>
        <div className="ops-grid">
          {data.integrations.slice(0, 3).map((integration) => (
            <article className="ops-card" data-ready={integration.ready ? "true" : "false"} key={integration.name}>
              <div>
                <span>{integration.role}</span>
                <h3>{integration.name}</h3>
              </div>
              <p>{integration.description}</p>
              <strong>{integration.ready ? "Configuré" : "À configurer"}</strong>
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
              {busy === "create" ? "Création en cours..." : "Lancer la préparation du dossier"}
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

          {completedSteps === 0 ? (
            <div className="center-action">
              <button disabled={Boolean(busy)} onClick={() => runStep("diagnostiqueur")} type="button" aria-busy={Boolean(busy)}>
                {busy ? "Traitement en cours..." : "Lancer le diagnostic du dossier"}
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
                {busy ? <p>Traitement en cours...</p> : null}
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
              {busy ? "Traitement en cours..." : "Continuer la préparation"}
            </button>
          </div>
        </section>
      ) : null}
      </div>
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
      </nav>
    </main>
  );
}
