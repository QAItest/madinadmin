import { openai } from "@ai-sdk/openai";

export const openAiModels = {
  orchestrator: process.env.OPENAI_MODEL_ORCHESTRATOR ?? "gpt-5.2",
  agent: process.env.OPENAI_MODEL_AGENT ?? "gpt-5.4-mini",
  audit: process.env.OPENAI_MODEL_AUDIT ?? "gpt-5.2"
};

export function modelForAgent(agent: string) {
  if (["controleur", "archiviste", "diagnostiqueur"].includes(agent)) {
    return openai(openAiModels.audit);
  }

  return openai(openAiModels.agent);
}

export function orchestratorModel() {
  return openai(openAiModels.orchestrator);
}