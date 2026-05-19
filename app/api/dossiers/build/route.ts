import { runAgent } from "../../../../lib/agents";

export async function POST(request: Request) {
  const payload = await request.json();
  if (!payload.porteurId) {
    return Response.json({ error: "porteurId est obligatoire." }, { status: 400 });
  }

  return Response.json(await runAgent(payload.porteurId, "monteur"));
}
