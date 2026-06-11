import type { IntegrationStatus } from "./integrations";

export type AgentKey =
  | "diagnostiqueur"
  | "monteur"
  | "documentaliste"
  | "controleur"
  | "suiveur"
  | "archiviste";

export type StepStatus = "pending" | "ready" | "done" | "blocked";

export type ModuleKey = "financement" | "energie";

export type Porteur = {
  id: string;
  module?: ModuleKey;
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

export type AdminDossierStatus = "a-demarrer" | "en-cours" | "pret";

export type AdminDossierSummary = {
  id: string;
  name: string;
  module: ModuleKey;
  structure: string;
  dispositif: string;
  budget: string;
  updatedAt: string;
  completedSteps: number;
  totalSteps: number;
  progress: number;
  status: AdminDossierStatus;
  nextStep?: AgentKey;
  nextStepTitle?: string;
};

export type AgentKpi = {
  key: AgentKey;
  title: string;
  folder: string;
  modelTier: string;
  modelEffort: string;
  qualityScore: number;
  speedScore: number;
  gainScore: number;
  modelRationale: string;
  primaryProvider: string;
  primaryModelName: string;
  primaryModel: string;
  reviewProvider: string;
  reviewModelName: string;
  reviewModel: string;
  backupProvider: string;
  backupModelName: string;
  backupModel: string;
  totalLivrables: number;
  completedDossiers: number;
  readyDossiers: number;
  pendingDossiers: number;
  completionRate: number;
  averageContentLength: number;
  runCount: number;
  successCount: number;
  fallbackCount: number;
  errorCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  averageDurationMs: number;
  lastRunStatus?: AgentRunStatus;
  lastRunProvider?: string;
  lastRunModel?: string;
  lastOutputAt?: string;
  lastRunAt?: string;
  providerBreakdown: AgentProviderKpi[];
};

export type AgentProviderKpi = {
  provider: AgentProviderRun["provider"];
  role: AgentProviderRun["role"];
  modelName: string;
  model: string;
  runCount: number;
  successCount: number;
  fallbackCount: number;
  errorCount: number;
  skippedCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  averageDurationMs: number;
  lastStatus?: AgentProviderRun["status"];
  lastRunAt?: string;
};

export type TokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  raw?: unknown;
};

export type AgentProviderRun = {
  provider: "openai" | "anthropic" | "huggingface";
  model: string;
  role: "generation" | "review" | "backup";
  status: "success" | "fallback" | "error" | "skipped";
  durationMs: number;
  usage?: TokenUsage;
  finishReason?: string;
  error?: string;
};

export type AgentRunStatus = "success" | "partial" | "fallback" | "error";

export type AgentRunLog = {
  id: string;
  porteurId: string;
  porteurName: string;
  agent: AgentKey;
  module: ModuleKey;
  livrablePath?: string;
  status: AgentRunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  providers: AgentProviderRun[];
};

export type AdminOverview = {
  dossiers: AdminDossierSummary[];
  agentKpis: AgentKpi[];
  modelOptions: {
    openai: string[];
    anthropic: string[];
    openSource: string[];
  };
  totals: {
    dossiers: number;
    inProgress: number;
    ready: number;
    notStarted: number;
    averageProgress: number;
    livrables: number;
  };
};

export type DashboardData = {
  integrations: IntegrationStatus[];
  admin: AdminOverview;
  porteurs: Porteur[];
  selected?: Porteur;
  steps: WorkflowStep[];
  livrables: Livrable[];
};

export type CreatePorteurInput = {
  module?: ModuleKey;
  name: string;
  territory: string;
  structure: string;
  project: string;
  dispositif: string;
  budget: string;
  deadline: string;
};
