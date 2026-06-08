import type { AgentKey, Porteur, TokenUsage } from "./types";
import { openSourceModelNameForAgent, openSourceReviewModelNameForAgent } from "./model-routing";
import { workflowTitle } from "./workflow";

type ChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string;
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    totalTokens?: number;
  };
};

export type OpenSourceResult = {
  text: string;
  model: string;
  usage?: TokenUsage;
  finishReason?: string;
};

const defaultBaseUrl = "https://router.huggingface.co/v1/chat/completions";

function apiKey() {
  return process.env.OPEN_SOURCE_API_KEY ?? process.env.HUGGINGFACE_API_KEY ?? process.env.HF_TOKEN;
}

function baseUrl() {
  return process.env.OPEN_SOURCE_BASE_URL ?? process.env.HUGGINGFACE_BASE_URL ?? defaultBaseUrl;
}

export function hasOpenSourceRuntime() {
  return Boolean(apiKey()) || Boolean(process.env.OPEN_SOURCE_ALLOW_UNAUTHENTICATED);
}

function normalizeUsage(usage?: ChatCompletionResponse["usage"]): TokenUsage | undefined {
  if (!usage) return undefined;
  const inputTokens = usage.prompt_tokens ?? usage.input_tokens;
  const outputTokens = usage.completion_tokens ?? usage.output_tokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens: usage.total_tokens ?? usage.totalTokens ?? (typeof inputTokens === "number" && typeof outputTokens === "number" ? inputTokens + outputTokens : undefined),
    raw: usage
  };
}

async function chatCompletion(input: {
  agent: AgentKey;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<OpenSourceResult> {
  const token = apiKey();
  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(baseUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user }
      ],
      max_tokens: input.maxTokens ?? 2800,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    throw new Error(`Open-source backup indisponible: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Open-source backup sans contenu exploitable");
  }

  return {
    text,
    model: input.model,
    usage: normalizeUsage(payload.usage),
    finishReason: payload.choices?.[0]?.finish_reason
  };
}

export async function generateWithOpenSource(input: {
  agent: AgentKey;
  system: string;
  prompt: unknown;
  frontmatter: string;
}) {
  const model = openSourceModelNameForAgent(input.agent);
  const result = await chatCompletion({
    agent: input.agent,
    model,
    system: input.system,
    user: JSON.stringify(input.prompt, null, 2)
  });

  return {
    ...result,
    text: result.text.startsWith("---") ? result.text : `${input.frontmatter}\n\n${result.text}`
  };
}

export async function reviewWithOpenSource(input: {
  agent: AgentKey;
  content: string;
  frontmatter: string;
  porteur: Porteur;
}) {
  const model = openSourceReviewModelNameForAgent(input.agent);
  const result = await chatCompletion({
    agent: input.agent,
    model,
    maxTokens: 3200,
    system:
      "Tu es un relecteur conformite pour Madin'Admin. Tu conserves le frontmatter YAML exactement, tu renforces les reserves, et tu ne mentionnes aucun outil, modele ou IA.",
    user: [
      `Porteur: ${input.porteur.name}`,
      `Module: ${input.porteur.module ?? "financement"}`,
      `Etape: ${workflowTitle(input.agent)}`,
      "",
      "Retourne uniquement le Markdown final.",
      "Frontmatter obligatoire:",
      input.frontmatter,
      "",
      "Livrable a relire:",
      input.content
    ].join("\n")
  });

  return {
    ...result,
    text: result.text.startsWith("---") ? result.text : `${input.frontmatter}\n\n${result.text}`
  };
}
