import { generateText } from "ai";
import { reviewLivrableWithAnthropic } from "./anthropic";
import { reviewModelNameForAgent } from "./model-routing";
import { generateWithOpenSource, hasOpenSourceRuntime, reviewWithOpenSource } from "./open-source";
import { modelForAgent, modelNameForAgent } from "./openai";
import { appendAgentRun, getPorteur, listPieces, pieceChecklistFor, readLivrables, renderFrontmatter, writeLivrable } from "./store";
import type { AgentKey, AgentProviderRun, AgentRunStatus, PieceChecklistItem, PieceJointe, Porteur, TokenUsage } from "./types";
import { workflowTitle } from "./workflow";

const systems: Record<AgentKey, string> = {
  diagnostiqueur:
    "Tu es le Diagnostiqueur Madin'Admin. Analyse eligibilite, cadrage et donnees manquantes. Non eligible est une reponse valide. N'invente rien.",
  monteur:
    "Tu es le Monteur Madin'Admin. Redige les sections du dossier avec logique d'intervention, cadre logique et indicateurs SMART raccordes au dispositif.",
  documentaliste:
    "Tu es le Documentaliste conformite Madin'Admin. Controle les pieces de maniere stricte avant traitement : categorie, presence, coherence avec le dossier, validite apparente, lisibilite, risque de non-conformite et decision bloquante. Tu n'accordes jamais une validation si une preuve manque, semble mal classee, illisible, incoherente ou insuffisante.",
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
  return "Erreur non renseignée";
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

function fallbackLivrable(input: { agent: AgentKey; frontmatter: string; livrables: Awaited<ReturnType<typeof readLivrables>>; porteur: Porteur }) {
  const { agent, frontmatter, livrables, porteur } = input;
  const energy = isEnergyDossier(porteur);
  const previous = livrables
    .slice(-3)
    .map((livrable) => `- ${workflowTitle(livrable.agent)} : ${livrable.title}`)
    .join("\n");
  const scope = energy
    ? "aides Agir Plus, travaux d'économie d'énergie, justificatifs techniques, devis, factures et installateur"
    : "subvention FEDER, projet, budget, cofinancement, calendrier, bénéficiaires et pièces administratives";

  return [
    frontmatter,
    "",
    `# ${workflowTitle(agent)} - ${porteur.name}`,
    "",
    "## Synthèse opérationnelle",
    "",
    `Le traitement distant n'est pas disponible pour le moment. Ce livrable structuré permet de continuer la préparation du dossier sans bloquer l'opérateur.`,
    "",
    "## Périmètre du dossier",
    "",
    `- Porteur : ${porteur.name}`,
    `- Structure : ${porteur.structure}`,
    `- Dispositif : ${porteur.dispositif}`,
    `- Module : ${energy ? "Madin'Énergie / Agir Plus" : "Financement de projet / FEDER"}`,
    `- Budget déclaré : ${porteur.budget}`,
    `- Objet : ${porteur.project}`,
    "",
    "## Sources disponibles",
    "",
    previous || "- Aucun livrable précédent disponible.",
    "",
    "## Analyse à compléter",
    "",
    `Vérifier les éléments liés au périmètre suivant : ${scope}.`,
    "",
    "## Points de vigilance",
    "",
    "- Confirmer l'éligibilité auprès des sources officielles du dispositif.",
    "- Contrôler la cohérence entre le projet, le budget et les pièces disponibles.",
    "- Ne pas déposer le dossier avant relecture et validation humaine.",
    energy
      ? "- Ne pas annoncer de montant de prime sans barème, devis et conditions applicables à jour."
      : "- Vérifier le taux de cofinancement, les dépenses éligibles et les obligations de publicité.",
    "",
    "## Prochaines actions",
    "",
    "- Relancer la génération lorsque le service distant est disponible.",
    "- Compléter les pièces manquantes dans le dossier actif.",
    "- Vérifier les dates, montants, signatures et justificatifs avant transmission.",
    "- Archiver la version relue avec les preuves utiles.",
    ""
  ].join("\n");
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
  const pieces = await listPieces(porteur.id);
  const pieceChecklist = pieceChecklistFor(porteur, pieces);
  let content: string | undefined;
  const frontmatter = renderFrontmatter(porteur, agent);
  const openAiModel = modelNameForAgent(agent);
  let prompt: {
    porteur: Porteur;
    livrables: Array<{ agent: AgentKey; title: string; path: string; excerpt: string }>;
    pieces: Array<Pick<PieceJointe, "id" | "originalName" | "category" | "mimeType" | "size" | "uploadedAt" | "status">>;
    piece_checklist: PieceChecklistItem[];
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
      pieces: pieces.map((piece) => ({
        id: piece.id,
        originalName: piece.originalName,
        category: piece.category,
        mimeType: piece.mimeType,
        size: piece.size,
        uploadedAt: piece.uploadedAt,
        status: piece.status
      })),
      piece_checklist: pieceChecklist,
      output_contract:
        agent === "documentaliste"
          ? "Retourne un livrable Markdown complet et strict avec sections Decision documentaire, Pieces recues, Pieces requises, Controle de conformite, Ecarts bloquants, Ecarts non bloquants, Actions correctives et Conclusion. La decision doit etre l'une de ces valeurs : BLOQUE, A_COMPLETER, RECEVABLE_SOUS_RESERVE, RECEVABLE. Si une piece requise est absente ou mal categorisee, la decision doit etre BLOQUE. Inclure le frontmatter YAML fourni sans le modifier."
          : isEnergyDossier(porteur)
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
      pieces: pieces.map((piece) => ({
        id: piece.id,
        originalName: piece.originalName,
        category: piece.category,
        mimeType: piece.mimeType,
        size: piece.size,
        uploadedAt: piece.uploadedAt,
        status: piece.status
      })),
      piece_checklist: pieceChecklist,
      output_contract:
        agent === "documentaliste"
          ? "Retourne un livrable Markdown complet et strict avec sections Decision documentaire, Pieces recues, Pieces requises, Controle de conformite, Ecarts bloquants, Ecarts non bloquants, Actions correctives et Conclusion. La decision doit etre l'une de ces valeurs : BLOQUE, A_COMPLETER, RECEVABLE_SOUS_RESERVE, RECEVABLE. Si une piece requise est absente ou mal categorisee, la decision doit etre BLOQUE. Inclure le frontmatter YAML fourni sans le modifier."
          : isEnergyDossier(porteur)
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
    const fallbackStartedAt = Date.now();
    content = fallbackLivrable({ agent, frontmatter, livrables, porteur });
    providerRuns.push({
      provider: "huggingface",
      model: "local-structured-fallback",
      role: "backup",
      status: "fallback",
      durationMs: elapsedSince(fallbackStartedAt),
      error: providerRuns.some((provider) => provider.status === "error")
        ? "Services distants indisponibles, livrable structuré généré en mode dégradé."
        : "Aucun service distant configuré, livrable structuré généré en mode dégradé."
    });
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
      model: reviewModelNameForAgent(agent),
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
