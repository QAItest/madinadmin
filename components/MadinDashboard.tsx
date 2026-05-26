"use client";

import { useMemo, useState } from "react";
import type { AgentKey, DashboardData, ModuleKey } from "../lib/types";

type Props = {
  initialData: DashboardData;
};

const agentsFinancement: Array<{ key: AgentKey; nom: string; role: string }> = [
  { key: "diagnostiqueur", nom: "Diagnostiqueur", role: "Eligibilite" },
  { key: "monteur", nom: "Monteur", role: "Redaction" },
  { key: "documentaliste", nom: "Documentaliste", role: "Checklist" },
  { key: "controleur", nom: "Controleur", role: "Conformite" },
  { key: "suiveur", nom: "Suiveur", role: "Post-depot" },
  { key: "archiviste", nom: "Archiviste", role: "Reporting" }
];

const agentsEnergie: Array<{ key: AgentKey; nom: string; role: string }> = [
  { key: "diagnostiqueur", nom: "Diagnostic energie", role: "Besoin & usage" },
  { key: "monteur", nom: "Aides Agir Plus", role: "Simulation" },
  { key: "documentaliste", nom: "Pieces energie", role: "Checklist" },
  { key: "controleur", nom: "Controle prime", role: "Eligibilite" },
  { key: "suiveur", nom: "Suivi travaux", role: "Versement" },
  { key: "archiviste", nom: "Preuves energie", role: "Factures" }
];

function moduleLabel(module?: ModuleKey) {
  return module === "energie" ? "Madin'Energie" : "Financement de projet";
}

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
  const selectedModule = data.selected?.module ?? "financement";
  const agents = selectedModule === "energie" ? agentsEnergie : agentsFinancement;

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
      const dispositif = module === "energie" ? "Madin'Energie - EDF Agir Plus" : "FEDER";
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
              ? `Diagnostic energie et aides EDF Agir Plus pour ${fields.name}`
              : `Dossier FEDER pour ${fields.name}`
        })
      });
      if (!response.ok) throw new Error(await response.text());
      const created = await response.json();
      await refresh(created.id);
      setShowCreate(false);
      setMessage("Dossier cree. Lancez le parcours multi-agents.");
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

  async function runAll() {
    for (const step of data.steps) {
      if (step.status === "pending") break;
      await runStep(step.key);
    }
  }

  return (
    <main className="mvp-shell">
      <header className="mvp-header">
        <div className="brand-row">
          <strong>Madin'Admin</strong>
          <span>Plateforme d'assistance administrative IA - Martinique & Guadeloupe</span>
        </div>
        <p>Orchestrateur multi-agents pour financements publics et transition energetique</p>
      </header>

      {message ? <div className="notice">{message}</div> : null}

      {showCreate ? (
        <section className="create-card">
          <h1>Creer un nouveau dossier</h1>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              createPorteur(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <label>
              Module
              <select name="module" defaultValue="financement">
                <option value="financement">Financement de projet</option>
                <option value="energie">Madin'Energie - aides EDF Agir Plus</option>
              </select>
            </label>
            <label>
              Nom du porteur
              <input name="name" required placeholder="ex: Residence Les Alizes" />
            </label>
            <label>
              Type de structure
              <select name="structure" defaultValue="TPE">
                <option>TPE</option>
                <option>PME</option>
                <option>Association loi 1901</option>
                <option>Collectivite territoriale</option>
                <option>Menage</option>
                <option>Hotel / commerce</option>
                <option>Bailleur social</option>
                <option>Installateur partenaire</option>
                <option>SCIC</option>
              </select>
            </label>
            <label>
              Budget ou estimation travaux
              <input name="budget" required placeholder="ex: 150000" type="number" />
            </label>
            <button type="submit" disabled={busy === "create"}>
              {busy === "create" ? "Creation en cours..." : "Lancer le parcours multi-agents"}
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
                  ID: {data.selected?.id ?? "-"} - Cree:{" "}
                  {data.selected ? new Date(data.selected.createdAt).toLocaleDateString("fr-FR") : "-"}
                </p>
              </div>
              <div className={completedSteps === agents.length ? "dossier-status complete" : "dossier-status"}>
                {completedSteps === agents.length ? "Complete" : "En cours"}
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
                <span>Etapes:</span> {completedSteps} / {agents.length}
              </div>
            </div>
          </div>

          <div className="agent-timeline" aria-label="Timeline agents">
            {agents.map((agent, index) => {
              const step = data.steps.find((item) => item.key === agent.key);
              const isComplete = step?.status === "done";
              const isCurrent = busy === agent.key;
              return (
                <button
                  className={`agent-node ${isComplete ? "done" : ""} ${step?.status === "ready" ? "ready" : ""} ${isCurrent ? "running" : ""}`}
                  disabled={!selectedId || step?.status === "pending" || Boolean(busy)}
                  key={agent.key}
                  onClick={() => runStep(agent.key)}
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
              <button disabled={Boolean(busy)} onClick={() => runStep("diagnostiqueur")} type="button">
                {busy ? "Traitement en cours..." : "Lancer le diagnostic multi-agents"}
              </button>
            </div>
          ) : null}

          <div className="livrable-workbench">
            <section className="journal">
              <div className="section-title">
                <h2>Journal de progression - {completedSteps} etape(s) traitee(s)</h2>
              </div>
              <div className="journal-list">
                {data.livrables.length === 0 ? <p>Aucun livrable pour l'instant.</p> : null}
                {data.livrables.map((livrable) => (
                  <button
                    className={selectedLivrable?.path === livrable.path ? "journal-item active" : "journal-item"}
                    key={livrable.path}
                    onClick={() => setActiveLivrable(livrable.path)}
                    type="button"
                  >
                    <span>{livrable.title}</span>
                    <small>{livrable.content.slice(0, 90).replace(/\s+/g, " ")}...</small>
                    <em>{new Date(livrable.createdAt).toLocaleTimeString("fr-FR")}</em>
                  </button>
                ))}
                {busy ? <p>Traitement en cours...</p> : null}
              </div>
            </section>

            <section className="livrables">
              <div className="section-title">
                <h2>{selectedLivrable ? `${selectedLivrable.title} - Livrable` : "Selectionnez un livrable"}</h2>
              </div>
              <pre>{selectedLivrable?.content ?? "Aucun livrable selectionne."}</pre>
            </section>
          </div>

          <div className="footer-actions">
            <button className="ghost-button" type="button" onClick={() => setShowCreate(true)}>
              Creer un nouveau dossier
            </button>
            <button disabled={Boolean(busy)} onClick={runAll} type="button">
              {busy ? "Traitement en cours..." : "Continuer le workflow"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
