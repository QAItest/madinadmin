import { openai } from "@ai-sdk/openai";
import type { AgentKey } from "./types";
import { modelNameForAgentRoute } from "./model-routing";

export const openAiModels = {
  orchestrator: process.env.OPENAI_MODEL_ORCHESTRATOR ?? "gpt-5.2",
  agent: process.env.OPENAI_MODEL_AGENT ?? "gpt-5.4-mini",
  audit: process.env.OPENAI_MODEL_AUDIT ?? "gpt-5.2"
};

export function modelForAgent(agent: AgentKey) {
  return openai(modelNameForAgent(agent));
}

export function modelNameForAgent(agent: AgentKey) {
  return modelNameForAgentRoute(agent);
}

export function orchestratorModel() {
  return openai(openAiModels.orchestrator);
}
