import { runAgent } from "../../../../lib/agents";
import type { AgentKey } from "../../../../lib/types";
import { workflowDefinitions } from "../../../../lib/workflow";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { porteurId?: string; agent?: AgentKey };
    if (!body.porteurId || !body.agent) {
      return Response.json({ error: "porteurId et agent sont obligatoires." }, { status: 400 });
    }

    if (!workflowDefinitions.some((step) => step.key === body.agent)) {
      return Response.json({ error: "Agent inconnu." }, { status: 400 });
    }

    return Response.json(await runAgent(body.porteurId, body.agent));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur workflow." },
      { status: 500 }
    );
  }
}
