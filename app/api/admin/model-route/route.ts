import { updateAgentModelOverride } from "../../../../lib/model-routing";
import type { AgentKey } from "../../../../lib/types";
import { workflowDefinitions } from "../../../../lib/workflow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      agent?: AgentKey;
      openaiModel?: string;
      anthropicReviewModel?: string;
      openSourceBackupModel?: string;
      openSourceReviewModel?: string;
      effort?: "low" | "standard" | "high";
    };

    if (!body.agent || !workflowDefinitions.some((step) => step.key === body.agent)) {
      return Response.json({ error: "Agent inconnu." }, { status: 400 });
    }

    return Response.json(
      updateAgentModelOverride(body.agent, {
        openaiModel: body.openaiModel,
        anthropicReviewModel: body.anthropicReviewModel,
        openSourceBackupModel: body.openSourceBackupModel,
        openSourceReviewModel: body.openSourceReviewModel,
        effort: body.effort
      })
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Configuration impossible." },
      { status: 500 }
    );
  }
}
