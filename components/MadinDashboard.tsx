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
              </button>
            ))}
          </div>

          <div className="next-action">
            <span>Prochaine action</span>
            <strong>{busy ? "Traitement en cours" : currentStep?.title ?? "Workflow complet"}</strong>
          </div>

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
