import { generateText } from "ai";
import { reviewLivrableWithAnthropic } from "./anthropic";
import { generateWithOpenSource, hasOpenSourceRuntime, reviewWithOpenSource } from "./open-source";
import { modelForAgent, modelNameForAgent } from "./openai";
import { appendAgentRun, getPorteur, readLivrables, renderFrontmatter, writeLivrable } from "./store";
import type { AgentKey, AgentProviderRun, AgentRunStatus, Porteur, TokenUsage } from "./types";
import { workflowTitle } from "./workflow";

const systems: Record<AgentKey, string> = {
  diagnostiqueur:
    "Tu es le Diagnostiqueur Madin'Admin. Analyse eligibilite, cadrage et donnees manquantes. Non eligible est une reponse valide. N'invente rien.",
  monteur:
    "Tu es le Monteur Madin'Admin. Redige les sections du dossier avec logique d'intervention, cadre logique et indicateurs SMART raccordes au dispositif.",
  documentaliste:
    "Tu es le Documentaliste Madin'Admin. Produis la checklist des pieces, signale les validites critiques et les pieces manquantes.",
  controleur:
    "Tu es le Controleur Madin'Admin. Audite coherence, budget, indicateurs, signatures et obligations. Une alerte rouge bloque la validation.",
  suiveur:
    "Tu es le Suiveur Madin'Admin. Organise journal post-depot, demandes de pieces, echeances et alertes 15/7/2 jours.",
  archiviste:
    "Tu es l'Archiviste Madin'Admin. Produis reporting, tracabilite decisionnelle et dossier de preuve conservable."
};

function isEnergyDossier(porteur: Porteur) {
  return (
    porteur.module === "energie" ||
    /energie|agir plus|edf/i.test(`${porteur.dispositif} ${porteur.project}`)
  );
}

function nowIso() {
  return new Date().toISOString();
}

function elapsedSince(startedAt: number) {
  return Math.max(Date.now() - startedAt, 0);
}

function safeError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 240);
  return "Erreur non renseignÃ©e";
}

function normalizeUsage(usage: unknown): TokenUsage | undefined {
  if (!usage || typeof usage !== "object") return undefined;
  const source = usage as {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cachedInputTokens?: number;
    reasoningTokens?: number;
    inputTokenDetails?: { cacheReadTokens?: number };
    outputTokenDetails?: { reasoningTokens?: number };
    raw?: unknown;
  };

  return {
    inputTokens: source.inputTokens,
    outputTokens: source.outputTokens,
    totalTokens: source.totalTokens,
    cachedInputTokens: source.cachedInputTokens ?? source.inputTokenDetails?.cacheReadTokens,
    reasoningTokens: source.reasoningTokens ?? source.outputTokenDetails?.reasoningTokens,
    raw: source.raw ?? usage
  };
}

export async function runAgent(porteurId: string, agent: AgentKey) {
  const startedAt = nowIso();
  const runStartedAt = Date.now();
  const providerRuns: AgentProviderRun[] = [];
  const porteur = await getPorteur(porteurId);
  if (!porteur) {
    throw new Error("Porteur introuvable");
  }

  const livrables = await readLivrables(porteur.id);
  let content: string | undefined;
  const frontmatter = renderFrontmatter(porteur, agent);
  const openAiModel = modelNameForAgent(agent);
  let prompt: {
    porteur: Porteur;
    livrables: Array<{ agent: AgentKey; title: string; path: string; excerpt: string }>;
    output_contract: string;
    frontmatter: string;
  } | undefined;

  if (process.env.OPENAI_API_KEY) {
    prompt = {
      porteur,
      livrables: livrables.map((item) => ({
        agent: item.agent,
        title: item.title,
        path: item.path,
        excerpt: item.content.slice(0, 5000)
      })),
      output_contract:
        isEnergyDossier(porteur)
          ? "Retourne un livrable Markdown complet pour le module Madin'Energie avec sections Sources lues, Diagnostic energie, Aides applicables, Pieces, Points de vigilance et Prochaines actions. Ne jamais inventer de montant de prime ou de critere EDF. Inclure le frontmatter YAML fourni sans le modifier."
          : "Retourne un livrable Markdown complet avec sections Sources lues, Analyse, Points de vigilance et Prochaines actions. Inclure le frontmatter YAML fourni sans le modifier.",
      frontmatter
    };

    try {
      const openAiStartedAt = Date.now();
      const result = await generateText({
        model: modelForAgent(agent),
        system: systems[agent],
        prompt: JSON.stringify(prompt, null, 2)
      });
      providerRuns.push({
        provider: "openai",
        model: openAiModel,
        role: "generation",
        status: "success",
        durationMs: elapsedSince(openAiStartedAt),
        usage: normalizeUsage(result.usage),
        finishReason: result.finishReason
      });
      content = result.text.startsWith("---") ? result.text : `${frontmatter}\n\n${result.text}`;
    } catch (error) {
      providerRuns.push({
        provider: "openai",
        model: openAiModel,
        role: "generation",
        status: "error",
        durationMs: 0,
        error: safeError(error)
      });
      if (hasOpenSourceRuntime() && prompt) {
        try {
          const openSourceStartedAt = Date.now();
          const backup = await generateWithOpenSource({ agent, system: systems[agent], prompt, frontmatter });
          content = backup.text;
          providerRuns.push({
            provider: "huggingface",
            model: backup.model,
            role: "backup",
            status: "success",
            durationMs: elapsedSince(openSourceStartedAt),
            usage: backup.usage,
            finishReason: backup.finishReason
          });
        } catch (backupError) {
          providerRuns.push({
            provider: "huggingface",
            model: "open-source-backup",
            role: "backup",
            status: "error",
            durationMs: 0,
            error: safeError(backupError)
          });
        }
      }
    }
  } else {
    prompt = {
      porteur,
      livrables: livrables.map((item) => ({
        agent: item.agent,
        title: item.title,
        path: item.path,
        excerpt: item.content.slice(0, 5000)
      })),
      output_contract:
        isEnergyDossier(porteur)
          ? "Retourne un livrable Markdown complet pour le module Madin'Energie avec sections Sources lues, Diagnostic energie, Aides applicables, Pieces, Points de vigilance et Prochaines actions. Ne jamais inventer de montant de prime ou de critere EDF. Inclure le frontmatter YAML fourni sans le modifier."
          : "Retourne un livrable Markdown complet avec sections Sources lues, Analyse, Points de vigilance et Prochaines actions. Inclure le frontmatter YAML fourni sans le modifier.",
      frontmatter
    };

    if (hasOpenSourceRuntime()) {
      try {
        const openSourceStartedAt = Date.now();
        const backup = await generateWithOpenSource({ agent, system: systems[agent], prompt, frontmatter });
        content = backup.text;
        providerRuns.push({
          provider: "huggingface",
          model: backup.model,
          role: "backup",
          status: "success",
          durationMs: elapsedSince(openSourceStartedAt),
          usage: backup.usage,
          finishReason: backup.finishReason
        });
      } catch (backupError) {
        providerRuns.push({
          provider: "huggingface",
          model: "open-source-backup",
          role: "backup",
          status: "error",
          durationMs: 0,
          error: safeError(backupError)
        });
      }
    }
  }

  if (!content) {
    await appendAgentRun({
      id: `${Date.now()}-${porteur.id}-${agent}`,
      porteurId: porteur.id,
      porteurName: porteur.name,
      agent,
      module: porteur.module ?? "financement",
      status: "error",
      startedAt,
      finishedAt: nowIso(),
      durationMs: elapsedSince(runStartedAt),
      providers: providerRuns
    });
    throw new Error("Aucun modÃ¨le distant disponible pour produire le livrable.");
  }

  const reviewStartedAt = Date.now();
  try {
    const review = await reviewLivrableWithAnthropic({ agent, content, frontmatter, porteur });
    content = review.text;
    providerRuns.push({
      provider: "anthropic",
      model: review.model,
      role: "review",
      status: review.changed ? "success" : process.env.ANTHROPIC_API_KEY ? "skipped" : "skipped",
      durationMs: elapsedSince(reviewStartedAt),
      usage: review.usage,
      finishReason: review.finishReason
    });
  } catch (error) {
    providerRuns.push({
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
      role: "review",
      status: "error",
      durationMs: elapsedSince(reviewStartedAt),
      error: safeError(error)
    });
    if (hasOpenSourceRuntime()) {
      try {
        const openSourceReviewStartedAt = Date.now();
        const backupReview = await reviewWithOpenSource({ agent, content, frontmatter, porteur });
        content = backupReview.text;
        providerRuns.push({
          provider: "huggingface",
          model: backupReview.model,
          role: "review",
          status: "success",
          durationMs: elapsedSince(openSourceReviewStartedAt),
          usage: backupReview.usage,
          finishReason: backupReview.finishReason
        });
      } catch (backupReviewError) {
        providerRuns.push({
          provider: "huggingface",
          model: "open-source-review",
          role: "review",
          status: "error",
          durationMs: 0,
          error: safeError(backupReviewError)
        });
      }
    }
  }

  const livrable = await writeLivrable(porteur, agent, content);
  const hasSuccessfulRemote = providerRuns.some((provider) => provider.status === "success");
  const hasFallback = providerRuns.some((provider) => provider.status === "fallback");
  const hasError = providerRuns.some((provider) => provider.status === "error");
  const status: AgentRunStatus = hasSuccessfulRemote && hasFallback ? "partial" : hasSuccessfulRemote ? "success" : hasError ? "fallback" : "fallback";

  await appendAgentRun({
    id: `${Date.now()}-${porteur.id}-${agent}`,
    porteurId: porteur.id,
    porteurName: porteur.name,
    agent,
    module: porteur.module ?? "financement",
    livrablePath: livrable.path,
    status,
    startedAt,
    finishedAt: nowIso(),
    durationMs: elapsedSince(runStartedAt),
    providers: providerRuns
  });

  return livrable;
}
