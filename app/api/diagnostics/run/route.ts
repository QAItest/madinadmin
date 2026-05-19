import { generateText } from "ai";
import { modelForAgent } from "../../../../lib/openai";

export async function POST(request: Request) {
  const payload = await request.json();

  const { text } = await generateText({
    model: modelForAgent("diagnostiqueur"),
    system: "Tu es le Diagnostiqueur Madin'Admin. Tu analyses l'eligibilite sans inventer de donnees. Reponds avec les donnees manquantes si necessaire.",
    prompt: JSON.stringify(payload, null, 2)
  });

  return Response.json({ agent: "diagnostiqueur", status: "draft", text });
}