import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AgentKey } from "./types";

export type AgentModelTier = "speed" | "balanced" | "audit" | "premium";

export type AgentModelRoute = {
  agent: AgentKey;
  tier: AgentModelTier;
  openaiModel: string;
  anthropicReviewModel: string;
  openSourceBackupModel: string;
  openSourceReviewModel: string;
  effort: "low" | "standard" | "high";
  qualityScore: number;
  speedScore: number;
  gainScore: number;
  rationale: string;
};

export type AgentModelOverride = Partial<
  Pick<AgentModelRoute, "openaiModel" | "anthropicReviewModel" | "openSourceBackupModel" | "openSourceReviewModel" | "effort">
>;

export class ModelOverrideValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ModelOverrideValidationError";
  }
}

export type AgentModelOptions = {
  openai: string[];
  anthropic: string[];
  openSource: string[];
};

const modelFrenchNames: Record<string, string> = {
  "gpt-5.5": "Stratège Grand Format",
  "gpt-5.4": "Pilote Polyvalent",
  "gpt-5.4-mini": "Opérateur Rapide",
  "gpt-5.3": "Pilote Standard",
  "gpt-5.2": "Auditeur Senior",
  o3: "Raisonneur Expert",
  "claude-haiku-4-5": "Relecteur Éclair",
  "claude-sonnet-4-6": "Relecteur Équilibre",
  "claude-opus-4-8": "Relecteur Premium",
  "claude-opus-4-7": "Relecteur Profond",
  "claude-opus-4-6": "Relecteur Renforcé",
  "Qwen/Qwen3-30B-A3B-Instruct-2507": "Relais Dossier",
  "mistralai/Mistral-Small-3.2-24B-Instruct-2506": "Relais Express",
  "meta-llama/Llama-3.3-70B-Instruct": "Relais Grand Volume",
  "google/gemma-3-27b-it": "Relais Synthèse",
  "Qwen/Qwen3-VL-30B-A3B-Instruct": "Relais Vision",
  "local-structured-fallback": "Secours Structuré"
};

const env = process.env;
const dataRoot = path.join(process.cwd(), ".data");
const overridesPath = path.join(dataRoot, "model-overrides.json");

const defaults = {
  openaiSpeed: env.OPENAI_MODEL_SPEED ?? env.OPENAI_MODEL_AGENT ?? "gpt-5.4-mini",
  openaiBalanced: env.OPENAI_MODEL_BALANCED ?? env.OPENAI_MODEL_AGENT ?? "gpt-5.4-mini",
  openaiAudit: env.OPENAI_MODEL_AUDIT ?? "gpt-5.2",
  openaiPremium: env.OPENAI_MODEL_PREMIUM ?? env.OPENAI_MODEL_ORCHESTRATOR ?? "gpt-5.5",
  anthropicSpeed: env.ANTHROPIC_MODEL_SPEED ?? env.ANTHROPIC_MODEL_HAIKU ?? "claude-haiku-4-5",
  anthropicBalanced: env.ANTHROPIC_MODEL_BALANCED ?? env.ANTHROPIC_MODEL_SONNET ?? env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  anthropicAudit: env.ANTHROPIC_MODEL_AUDIT ?? env.ANTHROPIC_MODEL_SONNET ?? env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
  anthropicPremium: env.ANTHROPIC_MODEL_PREMIUM ?? env.ANTHROPIC_MODEL_OPUS ?? "claude-opus-4-8",
  openSourceSpeed: env.OPEN_SOURCE_MODEL_SPEED ?? "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
  openSourceBalanced: env.OPEN_SOURCE_MODEL_BALANCED ?? "Qwen/Qwen3-30B-A3B-Instruct-2507",
  openSourceAudit: env.OPEN_SOURCE_MODEL_AUDIT ?? "Qwen/Qwen3-30B-A3B-Instruct-2507",
  openSourcePremium: env.OPEN_SOURCE_MODEL_PREMIUM ?? "meta-llama/Llama-3.3-70B-Instruct",
  openSourceVision: env.OPEN_SOURCE_MODEL_VISION ?? "Qwen/Qwen3-VL-30B-A3B-Instruct"
};

const routes: Record<AgentKey, Omit<AgentModelRoute, "agent">> = {
  diagnostiqueur: {
    tier: "audit",
    openaiModel: env.OPENAI_MODEL_DIAGNOSTIQUEUR ?? defaults.openaiAudit,
    anthropicReviewModel: env.ANTHROPIC_MODEL_DIAGNOSTIQUEUR ?? defaults.anthropicAudit,
    openSourceBackupModel: env.OPEN_SOURCE_MODEL_DIAGNOSTIQUEUR ?? defaults.openSourceAudit,
    openSourceReviewModel: env.OPEN_SOURCE_REVIEW_MODEL_DIAGNOSTIQUEUR ?? defaults.openSourceAudit,
    effort: "standard",
    qualityScore: 92,
    speedScore: 72,
    gainScore: 88,
    rationale: "Critique pour l'éligibilité et les risques initiaux, donc modèle robuste sans basculer en premium systématique."
  },
  monteur: {
    tier: "balanced",
    openaiModel: env.OPENAI_MODEL_MONTEUR ?? defaults.openaiBalanced,
    anthropicReviewModel: env.ANTHROPIC_MODEL_MONTEUR ?? defaults.anthropicBalanced,
    openSourceBackupModel: env.OPEN_SOURCE_MODEL_MONTEUR ?? defaults.openSourceBalanced,
    openSourceReviewModel: env.OPEN_SOURCE_REVIEW_MODEL_MONTEUR ?? defaults.openSourceBalanced,
    effort: "standard",
    qualityScore: 86,
    speedScore: 82,
    gainScore: 91,
    rationale: "Rédaction structurée à fort volume : équilibre vitesse/coût/qualité, avec relecture Sonnet."
  },
  documentaliste: {
    tier: "premium",
    openaiModel: env.OPENAI_MODEL_DOCUMENTALISTE ?? defaults.openaiPremium,
    anthropicReviewModel: env.ANTHROPIC_MODEL_DOCUMENTALISTE ?? defaults.anthropicPremium,
    openSourceBackupModel: env.OPEN_SOURCE_MODEL_DOCUMENTALISTE ?? defaults.openSourceVision,
    openSourceReviewModel: env.OPEN_SOURCE_REVIEW_MODEL_DOCUMENTALISTE ?? defaults.openSourcePremium,
    effort: "high",
    qualityScore: 98,
    speedScore: 52,
    gainScore: 84,
    rationale: "Contrôle strict des justificatifs : cohérence, conformité, validité, catégorie et blocage documentaire exigent le meilleur modèle disponible."
  },
  controleur: {
    tier: "premium",
    openaiModel: env.OPENAI_MODEL_CONTROLEUR ?? defaults.openaiPremium,
    anthropicReviewModel: env.ANTHROPIC_MODEL_CONTROLEUR ?? defaults.anthropicPremium,
    openSourceBackupModel: env.OPEN_SOURCE_MODEL_CONTROLEUR ?? defaults.openSourcePremium,
    openSourceReviewModel: env.OPEN_SOURCE_REVIEW_MODEL_CONTROLEUR ?? defaults.openSourcePremium,
    effort: "high",
    qualityScore: 98,
    speedScore: 55,
    gainScore: 84,
    rationale: "Étape la plus risquée : cohérence, conformité, blocages et arbitrages méritent le meilleur modèle disponible."
  },
  suiveur: {
    tier: "speed",
    openaiModel: env.OPENAI_MODEL_SUIVEUR ?? defaults.openaiSpeed,
    anthropicReviewModel: env.ANTHROPIC_MODEL_SUIVEUR ?? defaults.anthropicSpeed,
    openSourceBackupModel: env.OPEN_SOURCE_MODEL_SUIVEUR ?? defaults.openSourceSpeed,
    openSourceReviewModel: env.OPEN_SOURCE_REVIEW_MODEL_SUIVEUR ?? defaults.openSourceSpeed,
    effort: "low",
    qualityScore: 76,
    speedScore: 96,
    gainScore: 90,
    rationale: "Relances et échéances : workflow opérationnel, priorité à la vitesse et au coût."
  },
  archiviste: {
    tier: "balanced",
    openaiModel: env.OPENAI_MODEL_ARCHIVISTE ?? defaults.openaiBalanced,
    anthropicReviewModel: env.ANTHROPIC_MODEL_ARCHIVISTE ?? defaults.anthropicAudit,
    openSourceBackupModel: env.OPEN_SOURCE_MODEL_ARCHIVISTE ?? defaults.openSourcePremium,
    openSourceReviewModel: env.OPEN_SOURCE_REVIEW_MODEL_ARCHIVISTE ?? defaults.openSourceAudit,
    effort: "standard",
    qualityScore: 88,
    speedScore: 76,
    gainScore: 86,
    rationale: "Traçabilité et preuve demandent une bonne précision, sans le coût permanent du premium."
  }
};

function uniq(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export function modelFrenchName(model: string) {
  if (modelFrenchNames[model]) return modelFrenchNames[model];
  if (/mini|haiku|small/i.test(model)) return "Opérateur Rapide";
  if (/opus|premium|70b|5\.5/i.test(model)) return "Expert Renforcé";
  if (/sonnet|qwen|balanced|5\.4/i.test(model)) return "Pilote Équilibre";
  return "Moteur Configuré";
}

export function availableModelOptions(): AgentModelOptions {
  return {
    openai: uniq([
      defaults.openaiSpeed,
      defaults.openaiBalanced,
      defaults.openaiAudit,
      defaults.openaiPremium,
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.3",
      "gpt-5.2",
      "o3"
    ]),
    anthropic: uniq([
      defaults.anthropicSpeed,
      defaults.anthropicBalanced,
      defaults.anthropicAudit,
      defaults.anthropicPremium,
      "claude-haiku-4-5",
      "claude-sonnet-4-6",
      "claude-opus-4-8",
      "claude-opus-4-7",
      "claude-opus-4-6"
    ]),
    openSource: uniq([
      defaults.openSourceSpeed,
      defaults.openSourceBalanced,
      defaults.openSourceAudit,
      defaults.openSourcePremium,
      defaults.openSourceVision,
      "Qwen/Qwen3-30B-A3B-Instruct-2507",
      "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
      "meta-llama/Llama-3.3-70B-Instruct",
      "google/gemma-3-27b-it"
    ])
  };
}

export function readModelOverrides(): Partial<Record<AgentKey, AgentModelOverride>> {
  try {
    if (!existsSync(overridesPath)) return {};
    return JSON.parse(readFileSync(overridesPath, "utf8")) as Partial<Record<AgentKey, AgentModelOverride>>;
  } catch {
    return {};
  }
}

export function updateAgentModelOverride(agent: AgentKey, override: AgentModelOverride) {
  mkdirSync(dataRoot, { recursive: true });
  const sanitizedOverride = sanitizeAgentModelOverride(override);
  const overrides = readModelOverrides();
  overrides[agent] = {
    ...(overrides[agent] ?? {}),
    ...sanitizedOverride
  };
  writeFileSync(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`, "utf8");
  return routeForAgent(agent);
}

function validateOption(value: string, allowedValues: string[], label: string) {
  if (!allowedValues.includes(value)) {
    throw new ModelOverrideValidationError(`${label} invalide.`);
  }
}

export function sanitizeAgentModelOverride(override: AgentModelOverride): AgentModelOverride {
  const options = availableModelOptions();
  const sanitized: AgentModelOverride = {};

  if (typeof override.openaiModel === "string" && override.openaiModel.trim().length > 0) {
    validateOption(override.openaiModel, options.openai, "Modèle principal");
    sanitized.openaiModel = override.openaiModel;
  }

  if (typeof override.anthropicReviewModel === "string" && override.anthropicReviewModel.trim().length > 0) {
    validateOption(override.anthropicReviewModel, options.anthropic, "Modèle de relecture");
    sanitized.anthropicReviewModel = override.anthropicReviewModel;
  }

  if (typeof override.openSourceBackupModel === "string" && override.openSourceBackupModel.trim().length > 0) {
    validateOption(override.openSourceBackupModel, options.openSource, "Modèle de backup");
    sanitized.openSourceBackupModel = override.openSourceBackupModel;
  }

  if (typeof override.openSourceReviewModel === "string" && override.openSourceReviewModel.trim().length > 0) {
    validateOption(override.openSourceReviewModel, options.openSource, "Modèle de review open-source");
    sanitized.openSourceReviewModel = override.openSourceReviewModel;
  }

  if (typeof override.effort === "string" && override.effort.trim().length > 0) {
    validateOption(override.effort, ["low", "standard", "high"], "Niveau d'effort");
    sanitized.effort = override.effort;
  }

  if (Object.keys(sanitized).length === 0) {
    throw new ModelOverrideValidationError("Aucune mise à jour de routage valide n'a été fournie.");
  }

  return sanitized;
}

export function routeForAgent(agent: AgentKey): AgentModelRoute {
  const override = readModelOverrides()[agent] ?? {};
  return { agent, ...routes[agent], ...override };
}

export function modelNameForAgentRoute(agent: AgentKey) {
  return routeForAgent(agent).openaiModel;
}

export function reviewModelNameForAgent(agent: AgentKey) {
  return routeForAgent(agent).anthropicReviewModel;
}

export function openSourceModelNameForAgent(agent: AgentKey) {
  return routeForAgent(agent).openSourceBackupModel;
}

export function openSourceReviewModelNameForAgent(agent: AgentKey) {
  return routeForAgent(agent).openSourceReviewModel;
}
