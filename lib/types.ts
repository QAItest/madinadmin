export type AgentKey =
  | "diagnostiqueur"
  | "monteur"
  | "documentaliste"
  | "controleur"
  | "suiveur"
  | "archiviste";

export type StepStatus = "pending" | "ready" | "done" | "blocked";

export type Porteur = {
  id: string;
  name: string;
  territory: string;
  structure: string;
  project: string;
  dispositif: string;
  budget: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowStep = {
  key: AgentKey;
  title: string;
  folder: string;
  status: StepStatus;
  outputPath?: string;
  updatedAt?: string;
};

export type Livrable = {
  agent: AgentKey;
  title: string;
  path: string;
  content: string;
  createdAt: string;
};

export type DashboardData = {
  porteurs: Porteur[];
  selected?: Porteur;
  steps: WorkflowStep[];
  livrables: Livrable[];
};

export type CreatePorteurInput = {
  name: string;
  territory: string;
  structure: string;
  project: string;
  dispositif: string;
  budget: string;
  deadline: string;
};
