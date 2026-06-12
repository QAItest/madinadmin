import { runAgent } from "../../../../lib/agents";
import { missingRequiredPiecesFor } from "../../../../lib/store";
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
      return Response.json({ error: "Étape inconnue." }, { status: 400 });
    }

    const missingPieces = await missingRequiredPiecesFor(body.porteurId);
    if (missingPieces.length > 0) {
      return Response.json(
        {
          error: `Traitement bloqué : ${missingPieces.length} pièce(s) requise(s) manquante(s).`,
          missingPieces: missingPieces.map((piece) => piece.label)
        },
        { status: 428 }
      );
    }

    return Response.json(await runAgent(body.porteurId, body.agent));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur de préparation." },
      { status: 500 }
    );
  }
}
