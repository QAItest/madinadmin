import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AgentKey,
  AgentProviderKpi,
  AgentProviderRun,
  AdminDossierStatus,
  AdminOverview,
  AgentRunLog,
  CreatePorteurInput,
  DashboardData,
  Livrable,
  PieceCategory,
  PieceChecklistItem,
  PieceJointe,
  Porteur,
  WorkflowStep
} from "./types";
import { integrations } from "./integrations";
import { availableModelOptions, modelFrenchName, routeForAgent, reviewModelNameForAgent } from "./model-routing";
import { modelNameForAgent } from "./openai";
import { previousAgent, workflowDefinitions, workflowTitle } from "./workflow";

const root = process.cwd();
const porteursRoot = path.join(root, "porteurs");
const dataRoot = path.join(root, ".data");
const agentRunsPath = path.join(dataRoot, "agent-runs.json");
const piecesPath = path.join(dataRoot, "pieces.json");

const pieceLabels: Record<PieceCategory, string> = {
  identite: "Identité du porteur",
  statuts: "Statuts ou existence légale",
  budget: "Budget et plan de financement",
  devis: "Devis",
  factures: "Factures",
  attestations: "Attestations",
  technique: "Fiches techniques",
  rib: "RIB",
  autre: "Autre pièce"
};

const requiredPiecesByModule: Record<NonNullable<Porteur["module"]>, PieceCategory[]> = {
  financement: ["statuts", "budget", "devis", "attestations", "rib", "technique"],
  energie: ["identite", "devis", "factures", "technique", "attestations", "rib"]
};

export class DuplicatePieceError extends Error {
  status = 409;

  constructor(message: string) {
    super(message);
    this.name = "DuplicatePieceError";
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function normalizePieceName(value: string) {
  return value.trim().normalize("NFC").toLowerCase();
}

function contentHash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function ensureBaseDirs() {
  await mkdir(porteursRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });
  await Promise.all(workflowDefinitions.map((step) => mkdir(path.join(root, step.folder), { recursive: true })));
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function listPorteurs(): Promise<Porteur[]> {
  await ensureBaseDirs();
  const index = await readJson<Porteur[]>(path.join(dataRoot, "porteurs.json"), []);
  return index.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPorteur(id: string): Promise<Porteur | undefined> {
  return (await listPorteurs()).find((porteur) => porteur.id === id);
}

export async function createPorteur(input: CreatePorteurInput): Promise<Porteur> {
  await ensureBaseDirs();
  const date = now();
  const id = slugify(input.name) || `porteur-${Date.now()}`;
  const existing = await listPorteurs();
  const uniqueId = existing.some((porteur) => porteur.id === id) ? `${id}-${Date.now()}` : id;
  const porteur: Porteur = {
    id: uniqueId,
    module: input.module ?? "financement",
    name: input.name.trim(),
    territory: input.territory.trim(),
    structure: input.structure.trim(),
    project: input.project.trim(),
    dispositif: input.dispositif.trim(),
    budget: input.budget.trim(),
    deadline: input.deadline.trim(),
    createdAt: date,
    updatedAt: date
  };

  const porteurDir = path.join(porteursRoot, uniqueId);
  await mkdir(porteurDir, { recursive: true });
  await writeFile(
    path.join(porteurDir, "profil.md"),
    `---\nporteur: "${porteur.name}"\nmodule: "${porteur.module}"\nterritoire: "${porteur.territory}"\nstatut: "actif"\n---\n\n# ${porteur.name}\n\n## Structure\n\n${porteur.structure}\n\n## Projet\n\n${porteur.project}\n\n## Module\n\n${porteur.module === "energie" ? "Madin'Énergie" : "Financement de projet"}\n\n## Dispositif visé\n\n${porteur.dispositif}\n\n## Budget déclaré\n\n${porteur.budget || "Donnée manquante"}\n\n## Date cible\n\n${porteur.deadline || "Donnée manquante"}\n`,
    "utf8"
  );
  await writeFile(path.join(porteurDir, "statuts.md"), "# Statuts\n\nDonnées juridiques à compléter.\n", "utf8");
  await writeFile(path.join(porteurDir, "historique-dossiers.md"), "# Historique dossiers\n\nAucun dépôt historisé.\n", "utf8");

  await writeJson(path.join(dataRoot, "porteurs.json"), [porteur, ...existing]);
  return porteur;
}

export async function updatePorteurTimestamp(id: string) {
  const porteurs = await listPorteurs();
  const updated = porteurs.map((porteur) => (porteur.id === id ? { ...porteur, updatedAt: now() } : porteur));
  await writeJson(path.join(dataRoot, "porteurs.json"), updated);
}

function livrableFileName(porteur: Porteur, agent: AgentKey) {
  return `${today()}-${porteur.id}-${agent}.md`;
}

export async function readLivrables(porteurId: string): Promise<Livrable[]> {
  await ensureBaseDirs();
  const livrables = await Promise.all(
    workflowDefinitions.map(async (step) => {
      const dir = path.join(root, step.folder);
      try {
        const files = await readdir(dir);
        const matches = files
          .filter((file) => file.includes(porteurId) && file.endsWith(".md"))
          .sort()
          .reverse();
        const latest = matches[0];
        if (!latest) return undefined;
        const filePath = path.join(dir, latest);
        const fileStat = await stat(filePath);
        return {
          agent: step.key,
          title: workflowTitle(step.key),
          path: path.relative(root, filePath),
          content: await readFile(filePath, "utf8"),
          createdAt: fileStat.mtime.toISOString()
        } satisfies Livrable;
      } catch {
        return undefined;
      }
    })
  );

  return livrables.filter(Boolean) as Livrable[];
}

export async function writeLivrable(porteur: Porteur, agent: AgentKey, content: string): Promise<Livrable> {
  const definition = workflowDefinitions.find((step) => step.key === agent);
  if (!definition) {
    throw new Error(`Agent inconnu: ${agent}`);
  }

  const outputDir = path.join(root, definition.folder);
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, livrableFileName(porteur, agent));
  await writeFile(filePath, content, "utf8");
  await updatePorteurTimestamp(porteur.id);

  return {
    agent,
    title: workflowTitle(agent),
    path: path.relative(root, filePath),
    content,
    createdAt: now()
  };
}

export async function listPieces(porteurId?: string): Promise<PieceJointe[]> {
  await ensureBaseDirs();
  const pieces = await readJson<PieceJointe[]>(piecesPath, []);
  const filtered = porteurId ? pieces.filter((piece) => piece.porteurId === porteurId) : pieces;
  return filtered.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function pieceLabel(category: PieceCategory) {
  return pieceLabels[category] ?? pieceLabels.autre;
}

export function pieceChecklistFor(porteur: Porteur | undefined, pieces: PieceJointe[]): PieceChecklistItem[] {
  if (!porteur) return [];
  const module = porteur.module ?? "financement";
  const requiredPieces = requiredPiecesByModule[module];

  return requiredPieces.map((category) => {
    const count = pieces.filter((piece) => piece.category === category).length;
    return {
      category,
      label: pieceLabel(category),
      status: count > 0 ? "a-verifier" : "manquant",
      count
    };
  });
}

export async function missingRequiredPiecesFor(porteurId: string): Promise<PieceChecklistItem[]> {
  const porteur = await getPorteur(porteurId);
  if (!porteur) {
    throw new Error("Dossier introuvable.");
  }

  const pieces = await listPieces(porteurId);
  return pieceChecklistFor(porteur, pieces).filter((item) => item.count === 0);
}

export async function savePiece(input: {
  porteurId: string;
  originalName: string;
  category: PieceCategory;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}): Promise<PieceJointe> {
  await ensureBaseDirs();
  const porteur = await getPorteur(input.porteurId);
  if (!porteur) {
    throw new Error("Dossier introuvable.");
  }

  const originalName = input.originalName.trim() || "piece";
  const mimeType = input.mimeType || "application/octet-stream";
  const hash = contentHash(input.bytes);
  const pieces = await listPieces();
  const piecesForPorteur = pieces.filter((piece) => piece.porteurId === porteur.id);
  const duplicateName = piecesForPorteur.find((piece) => normalizePieceName(piece.originalName) === normalizePieceName(originalName));
  if (duplicateName) {
    throw new DuplicatePieceError(`Une pièce nommée "${originalName}" est déjà déposée sur ce dossier.`);
  }

  const duplicateContent = piecesForPorteur.find((piece) => piece.contentHash && piece.contentHash === hash && piece.mimeType === mimeType);
  if (duplicateContent) {
    throw new DuplicatePieceError(`Ce fichier est déjà déposé sous le nom "${duplicateContent.originalName}".`);
  }

  const extension = path.extname(originalName).toLowerCase();
  const baseName = slugify(path.basename(originalName, extension)) || "piece";
  const fileName = `${Date.now()}-${baseName}${extension}`;
  const relativePath = path.join("porteurs", porteur.id, "pieces", fileName);
  const absolutePath = path.join(root, relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, input.bytes);

  const piece: PieceJointe = {
    id: `${porteur.id}-${Date.now()}`,
    porteurId: porteur.id,
    fileName,
    originalName,
    category: input.category,
    contentHash: hash,
    mimeType,
    size: input.size,
    path: relativePath,
    uploadedAt: now(),
    status: "a-verifier"
  };

  await writeJson(piecesPath, [piece, ...pieces]);
  await updatePorteurTimestamp(porteur.id);
  return piece;
}

export async function deletePiece(input: { porteurId: string; pieceId: string }): Promise<PieceJointe> {
  await ensureBaseDirs();
  const pieces = await listPieces();
  const piece = pieces.find((item) => item.id === input.pieceId && item.porteurId === input.porteurId);
  if (!piece) {
    throw new Error("Pièce introuvable.");
  }

  const absolutePath = path.resolve(root, piece.path);
  const porteurPiecesRoot = path.resolve(porteursRoot, input.porteurId, "pieces");
  if (!absolutePath.startsWith(`${porteurPiecesRoot}${path.sep}`)) {
    throw new Error("Chemin de pièce non autorisé.");
  }

  await writeJson(
    piecesPath,
    pieces.filter((item) => item.id !== piece.id)
  );

  try {
    await unlink(absolutePath);
  } catch {
    // La métadonnée reste supprimée même si le fichier physique a déjà été retiré.
  }

  await updatePorteurTimestamp(input.porteurId);
  return piece;
}

export async function listAgentRuns(): Promise<AgentRunLog[]> {
  await ensureBaseDirs();
  return readJson<AgentRunLog[]>(agentRunsPath, []);
}

export async function appendAgentRun(run: AgentRunLog) {
  const runs = await listAgentRuns();
  await writeJson(agentRunsPath, [run, ...runs].slice(0, 1000));
}

export async function getWorkflowSteps(porteurId?: string): Promise<WorkflowStep[]> {
  if (!porteurId) {
    return workflowDefinitions.map((step, index) => ({ ...step, status: index === 0 ? "ready" : "pending" }));
  }

  const livrables = await readLivrables(porteurId);
  return workflowDefinitions.map((step, index) => {
    const livrable = livrables.find((item) => item.agent === step.key);
    if (livrable) {
      return { ...step, status: "done", outputPath: livrable.path, updatedAt: livrable.createdAt };
    }

    const previous = previousAgent(step.key);
    const ready = index === 0 || (previous && livrables.some((item) => item.agent === previous));
    return { ...step, status: ready ? "ready" : "pending" };
  });
}

function sumUsage(runs: AgentRunLog[], field: "inputTokens" | "outputTokens" | "totalTokens" | "cachedInputTokens" | "reasoningTokens") {
  return runs.reduce(
    (sum, run) => sum + run.providers.reduce((providerSum, provider) => providerSum + (provider.usage?.[field] ?? 0), 0),
    0
  );
}

function sumProviderUsage(providers: AgentProviderRun[], field: "inputTokens" | "outputTokens" | "totalTokens" | "cachedInputTokens" | "reasoningTokens") {
  return providers.reduce((sum, provider) => sum + (provider.usage?.[field] ?? 0), 0);
}

function providerBreakdownForAgent(runsForAgent: AgentRunLog[], definition: (typeof workflowDefinitions)[number]): AgentProviderKpi[] {
  const expectedProviders: Array<Pick<AgentProviderKpi, "provider" | "role" | "model">> = [
    { provider: "openai", role: "generation", model: modelNameForAgent(definition.key) },
    { provider: "anthropic", role: "review", model: reviewModelNameForAgent(definition.key) },
    { provider: "huggingface", role: "backup", model: routeForAgent(definition.key).openSourceBackupModel },
    { provider: "huggingface", role: "review", model: routeForAgent(definition.key).openSourceReviewModel }
  ];

  return expectedProviders.map((expected) => {
    const matchingProviders = runsForAgent.flatMap((run) =>
      run.providers
        .filter((provider) => provider.provider === expected.provider && provider.role === expected.role)
        .map((provider) => ({ provider, finishedAt: run.finishedAt }))
    );
    const last = matchingProviders.slice().sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    const totalDuration = matchingProviders.reduce((sum, item) => sum + item.provider.durationMs, 0);

    const model = last?.provider.model ?? expected.model;

    return {
      provider: expected.provider,
      role: expected.role,
      modelName: modelFrenchName(model),
      model,
      runCount: matchingProviders.length,
      successCount: matchingProviders.filter((item) => item.provider.status === "success").length,
      fallbackCount: matchingProviders.filter((item) => item.provider.status === "fallback").length,
      errorCount: matchingProviders.filter((item) => item.provider.status === "error").length,
      skippedCount: matchingProviders.filter((item) => item.provider.status === "skipped").length,
      inputTokens: sumProviderUsage(matchingProviders.map((item) => item.provider), "inputTokens"),
      outputTokens: sumProviderUsage(matchingProviders.map((item) => item.provider), "outputTokens"),
      totalTokens: sumProviderUsage(matchingProviders.map((item) => item.provider), "totalTokens"),
      cachedInputTokens: sumProviderUsage(matchingProviders.map((item) => item.provider), "cachedInputTokens"),
      reasoningTokens: sumProviderUsage(matchingProviders.map((item) => item.provider), "reasoningTokens"),
      averageDurationMs: matchingProviders.length > 0 ? Math.round(totalDuration / matchingProviders.length) : 0,
      lastStatus: last?.provider.status,
      lastRunAt: last?.finishedAt
    };
  });
}

async function getAdminOverview(porteurs: Porteur[]): Promise<AdminOverview> {
  const agentRuns = await listAgentRuns();
  const totalSteps = workflowDefinitions.length;
  const livrablesByPorteur = await Promise.all(
    porteurs.map(async (porteur) => ({
      porteur,
      livrables: await readLivrables(porteur.id)
    }))
  );

  const dossiers = livrablesByPorteur.map(({ porteur, livrables }) => {
    const completedSteps = livrables.length;
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const status: AdminDossierStatus = completedSteps === 0 ? "a-demarrer" : completedSteps === totalSteps ? "pret" : "en-cours";
    const nextDefinition = workflowDefinitions.find((step, index) => {
      if (livrables.some((livrable) => livrable.agent === step.key)) return false;
      if (index === 0) return true;
      const previous = workflowDefinitions[index - 1];
      return livrables.some((livrable) => livrable.agent === previous.key);
    });

    return {
      id: porteur.id,
      name: porteur.name,
      module: porteur.module ?? "financement",
      structure: porteur.structure,
      dispositif: porteur.dispositif,
      budget: porteur.budget,
      updatedAt: porteur.updatedAt,
      completedSteps,
      totalSteps,
      progress,
      status,
      nextStep: nextDefinition?.key,
      nextStepTitle: nextDefinition?.title
    };
  });

  const agentKpis = workflowDefinitions.map((definition, index) => {
    const route = routeForAgent(definition.key);
    const runsForAgent = agentRuns.filter((run) => run.agent === definition.key);
    const matchingLivrables = livrablesByPorteur
      .map(({ livrables }) => livrables.find((livrable) => livrable.agent === definition.key))
      .filter(Boolean) as Livrable[];
    const completedDossiers = matchingLivrables.length;
    const readyDossiers = livrablesByPorteur.filter(({ livrables }) => {
      if (livrables.some((livrable) => livrable.agent === definition.key)) return false;
      if (index === 0) return true;
      const previous = workflowDefinitions[index - 1];
      return livrables.some((livrable) => livrable.agent === previous.key);
    }).length;
    const pendingDossiers = Math.max(porteurs.length - completedDossiers - readyDossiers, 0);
    const totalContentLength = matchingLivrables.reduce((sum, livrable) => sum + livrable.content.length, 0);
    const lastOutputAt = matchingLivrables
      .map((livrable) => livrable.createdAt)
      .sort()
      .reverse()[0];
    const totalDuration = runsForAgent.reduce((sum, run) => sum + run.durationMs, 0);
    const lastRun = runsForAgent.slice().sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))[0];
    const lastProvider = lastRun?.providers.find((provider) => provider.status === "success") ?? lastRun?.providers[0];

    return {
      key: definition.key,
      title: definition.title,
      folder: definition.folder,
      modelTier: route.tier,
      modelEffort: route.effort,
      qualityScore: route.qualityScore,
      speedScore: route.speedScore,
      gainScore: route.gainScore,
      modelRationale: route.rationale,
      primaryProvider: "OpenAI",
      primaryModelName: modelFrenchName(route.openaiModel),
      primaryModel: route.openaiModel,
      reviewProvider: "Anthropic",
      reviewModelName: modelFrenchName(route.anthropicReviewModel),
      reviewModel: route.anthropicReviewModel,
      backupProvider: "Hugging Face",
      backupModelName: modelFrenchName(route.openSourceBackupModel),
      backupModel: route.openSourceBackupModel,
      totalLivrables: matchingLivrables.length,
      completedDossiers,
      readyDossiers,
      pendingDossiers,
      completionRate: porteurs.length > 0 ? Math.round((completedDossiers / porteurs.length) * 100) : 0,
      averageContentLength: matchingLivrables.length > 0 ? Math.round(totalContentLength / matchingLivrables.length) : 0,
      runCount: runsForAgent.length,
      successCount: runsForAgent.filter((run) => run.status === "success").length,
      fallbackCount: runsForAgent.filter((run) => run.status === "fallback" || run.status === "partial").length,
      errorCount: runsForAgent.filter((run) => run.status === "error").length,
      inputTokens: sumUsage(runsForAgent, "inputTokens"),
      outputTokens: sumUsage(runsForAgent, "outputTokens"),
      totalTokens: sumUsage(runsForAgent, "totalTokens"),
      cachedInputTokens: sumUsage(runsForAgent, "cachedInputTokens"),
      reasoningTokens: sumUsage(runsForAgent, "reasoningTokens"),
      averageDurationMs: runsForAgent.length > 0 ? Math.round(totalDuration / runsForAgent.length) : 0,
      lastRunStatus: lastRun?.status,
      lastRunProvider: lastProvider?.provider,
      lastRunModel: lastProvider?.model,
      lastOutputAt,
      lastRunAt: lastRun?.finishedAt,
      providerBreakdown: providerBreakdownForAgent(runsForAgent, definition)
    };
  });

  const averageProgress =
    dossiers.length > 0 ? Math.round(dossiers.reduce((sum, dossier) => sum + dossier.progress, 0) / dossiers.length) : 0;

  return {
    dossiers,
    agentKpis,
    modelOptions: availableModelOptions(),
    totals: {
      dossiers: dossiers.length,
      inProgress: dossiers.filter((dossier) => dossier.status === "en-cours").length,
      ready: dossiers.filter((dossier) => dossier.status === "pret").length,
      notStarted: dossiers.filter((dossier) => dossier.status === "a-demarrer").length,
      averageProgress,
      livrables: agentKpis.reduce((sum, agent) => sum + agent.totalLivrables, 0)
    }
  };
}

export async function getDashboardData(selectedId?: string): Promise<DashboardData> {
  const porteurs = await listPorteurs();
  const selected = selectedId
    ? porteurs.find((porteur) => porteur.id === selectedId)
    : porteurs[0];
  const pieces = selected ? await listPieces(selected.id) : [];

  return {
    integrations,
    admin: await getAdminOverview(porteurs),
    porteurs,
    selected,
    steps: await getWorkflowSteps(selected?.id),
    livrables: selected ? await readLivrables(selected.id) : [],
    pieces,
    pieceChecklist: selected ? pieceChecklistFor(selected, pieces) : []
  };
}

export function renderFrontmatter(porteur: Porteur, agent: AgentKey, statut = "brouillon") {
  return `---\nporteur: "${porteur.name}"\nmodule: "${porteur.module ?? "financement"}"\ndispositif: "${porteur.dispositif}"\ndossier: "${porteur.id}"\nagent: "${agent}"\ndate: "${today()}"\nversion: "v0.1"\nstatut: "${statut}"\n---`;
}
