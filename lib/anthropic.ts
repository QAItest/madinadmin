import type { AgentKey, Porteur } from "./types";
import { reviewModelNameForAgent } from "./model-routing";
import { workflowTitle } from "./workflow";

const anthropicUrl = "https://api.anthropic.com/v1/messages";

type AnthropicTextBlock = {
  text?: string;
  type: string;
};

type AnthropicResponse = {
  content?: AnthropicTextBlock[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  stop_reason?: string;
};

export type AnthropicReviewResult = {
  text: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cachedInputTokens?: number;
    raw?: unknown;
  };
  finishReason?: string;
  changed: boolean;
};

export function hasAnthropicRuntime() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function reviewLivrableWithAnthropic(input: {
  agent: AgentKey;
  content: string;
  frontmatter: string;
  porteur: Porteur;
}): Promise<AnthropicReviewResult> {
  const model = reviewModelNameForAgent(input.agent);

  if (!process.env.ANTHROPIC_API_KEY) {
    return { text: input.content, model, changed: false };
  }

  const response = await fetch(anthropicUrl, {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY
    },
    body: JSON.stringify({
      max_tokens: 3200,
      model,
      system:
        "Tu es un relecteur conformité pour Madin'Admin. Tu améliores le livrable sans mentionner d'outil, de modèle ou d'IA. Tu conserves le frontmatter YAML fourni exactement. Tu n'inventes aucun montant, critère, source officielle ou statut de validation.",
      messages: [
        {
          role: "user",
          content: [
            `Porteur: ${input.porteur.name}`,
            `Module: ${input.porteur.module ?? "financement"}`,
            `Etape: ${workflowTitle(input.agent)}`,
            "",
            "Contrat de sortie:",
            "- Retourner uniquement le Markdown final.",
            "- Conserver le frontmatter YAML en tête, sans le modifier.",
            "- Corriger les incohérences, renforcer les réserves de conformité et améliorer la lisibilité.",
            "- Ne pas ajouter de phrase indiquant une relecture, une assistance ou un moteur technique.",
            "",
            "Frontmatter obligatoire:",
            input.frontmatter,
            "",
            "Livrable à relire:",
            input.content
          ].join("\n")
        }
      ]
    })
  });

  if (!response.ok) {
    return { text: input.content, model, finishReason: `http-${response.status}`, changed: false };
  }

  const payload = (await response.json()) as AnthropicResponse;
  const text = payload.content?.find((block) => block.type === "text" && block.text)?.text?.trim();
  const usage = payload.usage
    ? {
        inputTokens: payload.usage.input_tokens,
        outputTokens: payload.usage.output_tokens,
        totalTokens:
          typeof payload.usage.input_tokens === "number" && typeof payload.usage.output_tokens === "number"
            ? payload.usage.input_tokens + payload.usage.output_tokens
            : undefined,
        cachedInputTokens: payload.usage.cache_read_input_tokens,
        raw: payload.usage
      }
    : undefined;

  if (!text) {
    return { text: input.content, model, usage, finishReason: payload.stop_reason, changed: false };
  }

  return {
    text: text.startsWith("---") ? text : `${input.frontmatter}\n\n${text}`,
    model,
    usage,
    finishReason: payload.stop_reason,
    changed: true
  };
}
