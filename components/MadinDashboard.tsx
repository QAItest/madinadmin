"use client";

import { useMemo, useState } from "react";
import type { AgentKey, DashboardData } from "../lib/types";

type Props = {
  initialData: DashboardData;
};

const statusLabels = {
  pending: "En attente",
  ready: "Pret",
  done: "Produit",
  blocked: "Bloque"
};

export function MadinDashboard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialData.selected?.id ?? "");
  const [activeLivrable, setActiveLivrable] = useState(initialData.livrables[0]?.path ?? "");
  const [busy, setBusy] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  const selectedLivrable = useMemo(
    () => data.livrables.find((livrable) => livrable.path === activeLivrable) ?? data.livrables[0],
    [activeLivrable, data.livrables]
  );

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
      setMessage("Porteur cree et memoire initialisee.");
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
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Madin'Admin x ChatGPT</p>
          <h1>Plateforme multi-agent administrative</h1>
          <p>
            Cree un porteur, lance la chaine FEDER/FSE+, puis consulte les livrables Markdown
            versionnes par agent.
          </p>
        </div>
        <div className="status-panel">
          <span className="badge">OpenAI ready</span>
          <strong>{data.porteurs.length}</strong>
          <small>porteur(s)</small>
        </div>
      </header>

      {message ? <div className="notice">{message}</div> : null}

      <section className="workspace">
        <aside className="sidebar">
          <h2>Nouveau porteur</h2>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              createPorteur(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <label>
              Nom
              <input name="name" required placeholder="Association pilote" />
            </label>
            <label>
              Territoire
              <select name="territory" defaultValue="Martinique">
                <option>Martinique</option>
                <option>Guadeloupe</option>
              </select>
            </label>
            <label>
              Structure
              <input name="structure" required placeholder="Association loi 1901" />
            </label>
            <label>
              Dispositif
              <input name="dispositif" required placeholder="FEDER" />
            </label>
            <label>
              Budget
              <input name="budget" placeholder="145000 EUR" />
            </label>
            <label>
              Date cible
              <input name="deadline" type="date" />
            </label>
            <label>
              Projet
              <textarea name="project" required rows={5} placeholder="Transition numerique..." />
            </label>
            <button type="submit" disabled={busy === "create"}>
              {busy === "create" ? "Creation..." : "Creer"}
            </button>
          </form>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Dossier actif</h2>
              <p>{data.selected ? data.selected.project : "Aucun porteur selectionne."}</p>
            </div>
            <select
              value={selectedId}
              onChange={async (event) => {
                setSelectedId(event.target.value);
                await refresh(event.target.value);
              }}
            >
              {data.porteurs.length === 0 ? <option value="">Aucun porteur</option> : null}
              {data.porteurs.map((porteur) => (
                <option key={porteur.id} value={porteur.id}>
                  {porteur.name}
                </option>
              ))}
            </select>
          </div>

          <div className="workflow">
            {data.steps.map((step) => (
              <article className={`step-card ${step.status}`} key={step.key}>
                <div>
                  <span>{statusLabels[step.status]}</span>
                  <h3>{step.title}</h3>
                  {step.outputPath ? <small>{step.outputPath}</small> : <small>{step.folder}/</small>}
                </div>
                <button
                  type="button"
                  disabled={!selectedId || step.status === "pending" || busy === step.key}
                  onClick={() => runStep(step.key)}
                >
                  {busy === step.key ? "Generation..." : step.status === "done" ? "Regenerer" : "Lancer"}
                </button>
              </article>
            ))}
          </div>

          <div className="livrables">
            <div className="tabs">
              {data.livrables.length === 0 ? <span>Aucun livrable genere</span> : null}
              {data.livrables.map((livrable) => (
                <button
                  key={livrable.path}
                  type="button"
                  className={selectedLivrable?.path === livrable.path ? "active" : ""}
                  onClick={() => setActiveLivrable(livrable.path)}
                >
                  {livrable.title}
                </button>
              ))}
            </div>
            <pre>{selectedLivrable?.content ?? "Cree un porteur puis lance le diagnostic pour commencer."}</pre>
          </div>
        </section>
      </section>
    </main>
  );
}
