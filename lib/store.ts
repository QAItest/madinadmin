import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AgentKey,
  CreatePorteurInput,
  DashboardData,
  Livrable,
  Porteur,
  WorkflowStep
} from "./types";
import { previousAgent, workflowDefinitions, workflowTitle } from "./workflow";

const root = process.cwd();
const porteursRoot = path.join(root, "porteurs");
const dataRoot = path.join(root, ".data");

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
    `---\nporteur: "${porteur.name}"\nmodule: "${porteur.module}"\nterritoire: "${porteur.territory}"\nstatut: "actif"\n---\n\n# ${porteur.name}\n\n## Structure\n\n${porteur.structure}\n\n## Projet\n\n${porteur.project}\n\n## Module\n\n${porteur.module === "energie" ? "Madin'Energie" : "Financement de projet"}\n\n## Dispositif vise\n\n${porteur.dispositif}\n\n## Budget declare\n\n${porteur.budget || "Donnee manquante"}\n\n## Date cible\n\n${porteur.deadline || "Donnee manquante"}\n`,
    "utf8"
  );
  await writeFile(path.join(porteurDir, "statuts.md"), "# Statuts\n\nDonnees juridiques a completer.\n", "utf8");
  await writeFile(path.join(porteurDir, "historique-dossiers.md"), "# Historique dossiers\n\nAucun depot historise.\n", "utf8");

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

export async function getDashboardData(selectedId?: string): Promise<DashboardData> {
  const porteurs = await listPorteurs();
  const selected = selectedId
    ? porteurs.find((porteur) => porteur.id === selectedId)
    : porteurs[0];

  return {
    porteurs,
    selected,
    steps: await getWorkflowSteps(selected?.id),
    livrables: selected ? await readLivrables(selected.id) : []
  };
}

export function renderFrontmatter(porteur: Porteur, agent: AgentKey, statut = "brouillon") {
  return `---\nporteur: "${porteur.name}"\nmodule: "${porteur.module ?? "financement"}"\ndispositif: "${porteur.dispositif}"\ndossier: "${porteur.id}"\nagent: "${agent}"\ndate: "${today()}"\nversion: "v0.1"\nstatut: "${statut}"\n---`;
}
