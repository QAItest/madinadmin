import type { AgentKey, WorkflowStep } from "./types";

export const workflowDefinitions: Array<Omit<WorkflowStep, "status" | "outputPath" | "updatedAt">> = [
  {
    key: "diagnostiqueur",
    title: "Diagnostic d'éligibilité",
    folder: "diagnostics"
  },
  {
    key: "monteur",
    title: "Montage du dossier",
    folder: "dossiers"
  },
  {
    key: "documentaliste",
    title: "Checklist pièces",
    folder: "checklists"
  },
  {
    key: "controleur",
    title: "Contrôle conformité",
    folder: "controles"
  },
  {
    key: "suiveur",
    title: "Suivi post-dépôt",
    folder: "suivi"
  },
  {
    key: "archiviste",
    title: "Archivage et preuve",
    folder: "archives"
  }
];

export function previousAgent(agent: AgentKey): AgentKey | undefined {
  const index = workflowDefinitions.findIndex((step) => step.key === agent);
  return index > 0 ? workflowDefinitions[index - 1].key : undefined;
}

export function workflowTitle(agent: AgentKey) {
  return workflowDefinitions.find((step) => step.key === agent)?.title ?? agent;
}
