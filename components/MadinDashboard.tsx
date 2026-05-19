"use client";

import { useMemo, useState } from "react";
import type { AgentKey, DashboardData } from "../lib/types";

type Props = {
  initialData: DashboardData;
};

const agentShortLabels: Record<AgentKey, string> = {
  diagnostiqueur: "Eligibilite",
  monteur: "Redaction",
  documentaliste: "Checklist",
  controleur: "Conformite",
  suiveur: "Post-depot",
  archiviste: "Reporting"
};

const levelTitles = ["Initialisation", "Cadrage", "Montage", "Conformite", "Suivi", "Preuve", "Pret controle"];
const officialDemandUrl = "https://www.europe-martinique.com/je-fais-une-demande/";
const europacAuthUrl = "https://europac.europe-martinique.com/sub/tiers/authentification";
const fraudReportUrl =
  "https://www.europe-martinique.com/signaler-une-fraude-dans-le-cadre-de-la-gestion-des-fonds-europeens/";
const funds = [
  {
    code: "FEADER",
    name: "Fonds Europeen Agricole pour le Developpement Rural",
    focus: "Agriculture, ruralite, installation, transformation, developpement rural"
  },
  {
    code: "FEDER",
    name: "Fonds Europeen de Developpement Regional",
    focus: "Innovation, numerique, transition, infrastructures, competitivite"
  },
  {
    code: "FSE+",
    name: "Fonds Social Europeen Plus",
    focus: "Emploi, inclusion, formation, insertion, competences"
  },
  {
    code: "FEAMPA",
    name: "Fonds Europeen pour les Affaires Maritimes, la Peche et l'Aquaculture",
    focus: "Peche, aquaculture, economie maritime, filieres halieutiques"
  }
];
const europacGuideSteps = [
  {
    title: "Compte d'acces",
    detail: "Se connecter ou creer l'acces porteur, puis verifier l'activation du compte."
  },
  {
    title: "Fiche tiers",
    detail: "Completer l'identification, SIRET, adresse, representant, contacts et certification."
  },
  {
    title: "Coordonnees bancaires",
    detail: "Renseigner l'IBAN et joindre les justificatifs demandes."
  },
  {
    title: "Dispositif",
    detail: "Choisir le fonds ou l'appel ouvert avant de saisir la demande d'aide."
  },
  {
    title: "Pieces",
    detail: "Televerser les documents administratifs, financiers et techniques."
  },
  {
    title: "Validation",
    detail: "Controler, certifier, transmettre et conserver l'accuse de reception."
  }
];

export function MadinDashboard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialData.selected?.id ?? "");
  const [activeLivrable, setActiveLivrable] = useState(initialData.livrables[0]?.path ?? "");
  const [busy, setBusy] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(!initialData.selected);

  const selectedLivrable = useMemo(
    () => data.livrables.find((livrable) => livrable.path === activeLivrable) ?? data.livrables[0],
    [activeLivrable, data.livrables]
  );
  const completedSteps = data.steps.filter((step) => step.status === "done").length;
  const currentStep =
    data.steps.find((step) => step.status === "ready") ?? data.steps.find((step) => step.status === "pending");
  const progress = Math.round((completedSteps / Math.max(data.steps.length, 1)) * 100);
  const dossierScore = completedSteps * 100 + data.livrables.length * 25;
  const levelTitle = levelTitles[Math.min(completedSteps, levelTitles.length - 1)];

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
      const response = await fetch("/api/porteurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      if (!response.ok) throw new Error(await response.text());
      const created = await response.json();
      await refresh(created.id);
      setShowCreate(false);
      setMessage("Dossier cree. Lancez le diagnostic pour demarrer la chaine.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Creation impossible.");
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
      setMessage(`${livrable.title} genere.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generation impossible.");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <main className="mvp-shell">
      <header className="mvp-header">
        <div className="brand-row">
          <strong>Madin'Admin</strong>
          <span>Plateforme d'assistance administrative IA - Martinique & Guadeloupe</span>
        </div>
        <p>Orchestrateur multi-agents pour dossiers FEDER, FSE+ et dispositifs publics</p>
      </header>

      {message ? <div className="notice">{message}</div> : null}

      {showCreate ? (
        <section className="create-card">
          <div className="section-title standalone">
            <h1>Creer un nouveau dossier FEDER</h1>
            <span>ChatGPT / OpenAI</span>
          </div>
          <div className="onboarding-track">
            <div>
              <strong>4 fonds</strong>
              <span>FEADER, FEDER, FSE+ et FEAMPA selon la nature du projet.</span>
            </div>
            <div>
              <strong>6 missions</strong>
              <span>Diagnostic, montage, pieces, controle, suivi, preuve.</span>
            </div>
            <div>
              <strong>Score dossier</strong>
              <span>Chaque livrable produit fait avancer la jauge.</span>
            </div>
            <div>
              <strong>Badges</strong>
              <span>Les etapes terminees restent visibles dans le journal.</span>
            </div>
          </div>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              createPorteur(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <label>
              Nom du porteur
              <input name="name" required placeholder="Association Culturelle La Mariniere" />
            </label>
            <label>
              Type de structure
              <select name="structure" defaultValue="TPE">
                <option>TPE</option>
                <option>PME</option>
                <option>Association loi 1901</option>
                <option>Collectivite territoriale</option>
                <option>SCIC</option>
              </select>
            </label>
            <label>
              Territoire
              <select name="territory" defaultValue="Martinique">
                <option>Martinique</option>
                <option>Guadeloupe</option>
              </select>
            </label>
            <label>
              Dispositif
              <input name="dispositif" required defaultValue="FEDER" />
            </label>
            <label>
              Budget previsionnel
              <input name="budget" placeholder="150000 EUR" />
            </label>
            <label>
              Date cible
              <input name="deadline" type="date" />
            </label>
            <label>
              Projet
              <textarea name="project" required rows={5} placeholder="Decrivez le projet, les publics vises et les actions principales." />
            </label>
            <button type="submit" disabled={busy === "create"}>
              {busy === "create" ? "Creation en cours..." : "Creer le dossier"}
            </button>
          </form>
          {data.porteurs.length > 0 ? (
            <button className="ghost-button" type="button" onClick={() => setShowCreate(false)}>
              Revenir au dossier actif
            </button>
          ) : null}
        </section>
      ) : (
        <section className="mvp-dossier">
          <div className="dossier-card">
            <div className="dossier-card-head">
              <div>
                <h1>{data.selected?.name ?? "Aucun dossier"}</h1>
                <p>
                  ID: {data.selected?.id ?? "-"} · Etapes: {completedSteps} / {data.steps.length}
                </p>
              </div>
              <div className={completedSteps === data.steps.length ? "dossier-status complete" : "dossier-status"}>
                {completedSteps === data.steps.length ? "Complete" : "En cours"}
              </div>
            </div>

            <div className="game-panel" aria-label="Progression dossier">
              <div className="score-card">
                <span>Niveau dossier</span>
                <strong>{levelTitle}</strong>
              </div>
              <div className="score-card">
                <span>Score</span>
                <strong>{dossierScore} pts</strong>
              </div>
              <div className="progress-card">
                <div>
                  <span>Progression</span>
                  <strong>{progress}%</strong>
                </div>
                <div className="progress-bar" aria-hidden="true">
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="dossier-meta">
              <div>
                <span>Structure</span>
                <strong>{data.selected?.structure ?? "-"}</strong>
              </div>
              <div>
                <span>Dispositif</span>
                <strong>{data.selected?.dispositif ?? "-"}</strong>
              </div>
              <div>
                <span>Budget</span>
                <strong>{data.selected?.budget || "A completer"}</strong>
              </div>
              <div>
                <span>Dossier actif</span>
                <select
                  value={selectedId}
                  onChange={async (event) => {
                    setSelectedId(event.target.value);
                    await refresh(event.target.value);
                  }}
                >
                  {data.porteurs.map((porteur) => (
                    <option key={porteur.id} value={porteur.id}>
                      {porteur.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="agent-timeline" aria-label="Timeline agents">
            {data.steps.map((step, index) => (
              <button
                className={`agent-node ${step.status} ${busy === step.key ? "running" : ""}`}
                disabled={!selectedId || step.status === "pending" || Boolean(busy)}
                key={step.key}
                onClick={() => runStep(step.key)}
                type="button"
              >
                <span className="agent-index">{index + 1}</span>
                <strong>{step.title}</strong>
                <small>{agentShortLabels[step.key]}</small>
                {step.status === "done" ? <em>Badge obtenu</em> : null}
              </button>
            ))}
          </div>

          <div className="next-action">
            <div>
              <span>Prochaine mission</span>
              <strong>{busy ? "Traitement en cours" : currentStep?.title ?? "Workflow complet"}</strong>
            </div>
            <small>
              {busy
                ? "L'agent produit le livrable."
                : currentStep
                  ? "Terminez cette mission pour debloquer la suivante."
                  : "Tous les badges du dossier sont obtenus."}
            </small>
          </div>

          <div className="badge-board" aria-label="Badges obtenus">
            {data.steps.map((step) => (
              <div className={step.status === "done" ? "badge-token earned" : "badge-token"} key={step.key}>
                <span>{step.title}</span>
                <strong>{step.status === "done" ? "Obtenu" : step.status === "ready" ? "Disponible" : "Verrouille"}</strong>
              </div>
            ))}
          </div>

          <section className="funds-card">
            <div className="section-title standalone">
              <h2>Les 4 fonds Europe Martinique</h2>
              <span>Choix du guichet</span>
            </div>
            <div className="fund-grid">
              {funds.map((fund) => (
                <article
                  className={data.selected?.dispositif.toLowerCase().includes(fund.code.toLowerCase().replace("+", "")) ? "fund-item selected" : "fund-item"}
                  key={fund.code}
                >
                  <strong>{fund.code}</strong>
                  <span>{fund.name}</span>
                  <p>{fund.focus}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="official-card">
            <div>
              <span>Mission depot officiel</span>
              <h2>Assistant Europac - depot guide</h2>
              <p>
                Inspirez-vous du tutoriel Europac : preparez le compte, la fiche tiers, les pieces,
                puis saisissez la demande avant le debut des travaux.
              </p>
            </div>
            <div className="official-checks">
              <span>Avant depot</span>
              <strong>{completedSteps >= 4 ? "Pret pour revue porteur" : "Controle conformite requis"}</strong>
              <small>Appel a projets, fil de l'eau, fiches actions et liste des pieces.</small>
            </div>
            <div className="official-actions">
              <a href={officialDemandUrl} rel="noreferrer" target="_blank">
                Guide demande
              </a>
              <a href={europacAuthUrl} rel="noreferrer" target="_blank">
                Acces Europac
              </a>
            </div>
          </section>

          <section className="europac-guide" aria-label="Tutoriel Europac">
            <div className="section-title standalone">
              <h2>Parcours inspire du tutoriel Europac</h2>
              <span>{completedSteps >= 4 ? "Pret a saisir" : "Preparation"}</span>
            </div>
            <div className="europac-steps">
              {europacGuideSteps.map((step, index) => (
                <div
                  className={index < Math.max(1, Math.min(completedSteps + 1, europacGuideSteps.length)) ? "europac-step active" : "europac-step"}
                  key={step.title}
                >
                  <strong>{index + 1}</strong>
                  <div>
                    <span>{step.title}</span>
                    <p>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="fraud-card">
            <div>
              <span>Mission vigilance</span>
              <h2>Fraude et conflit d'interets</h2>
              <p>
                Un signalement peut concerner de faux documents, une retention indue de fonds, un
                detournement, une corruption, un favoritisme ou un conflit d'interets.
              </p>
            </div>
            <div className="fraud-checks">
              <span>Canaux officiels</span>
              <strong>CTM, OLAF, Parquet europeen</strong>
              <small>Confidentialite et protection du lanceur d'alerte indiquees par Europe Martinique.</small>
            </div>
            <a href={fraudReportUrl} rel="noreferrer" target="_blank">
              Signaler une fraude
            </a>
          </section>

          <div className="livrable-workbench">
            <section className="journal">
              <div className="section-title">
                <h2>Journal de progression</h2>
                <span>{data.livrables.length} livrable(s)</span>
              </div>
              <div className="journal-list">
                {data.livrables.length === 0 ? <p>Aucun livrable pour l'instant.</p> : null}
                {data.livrables.map((livrable) => (
                  <button
                    key={livrable.path}
                    type="button"
                    className={selectedLivrable?.path === livrable.path ? "journal-item active" : "journal-item"}
                    onClick={() => setActiveLivrable(livrable.path)}
                  >
                    <span>{livrable.title}</span>
                    <small>{livrable.content.slice(0, 110).replace(/\s+/g, " ")}...</small>
                    <em>{new Date(livrable.createdAt).toLocaleTimeString("fr-FR")}</em>
                  </button>
                ))}
                {busy ? <p>Traitement en cours...</p> : null}
              </div>
            </section>

            <section className="livrables">
              <div className="section-title">
                <h2>{selectedLivrable?.title ?? "Selectionnez un livrable"}</h2>
                <span>{selectedLivrable ? "Markdown" : "Vide"}</span>
              </div>
              <pre>{selectedLivrable?.content ?? "Lancez le diagnostic pour generer le premier livrable."}</pre>
            </section>
          </div>

          <div className="footer-actions">
            <button className="ghost-button" type="button" onClick={() => setShowCreate(true)}>
              Creer un nouveau dossier
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
