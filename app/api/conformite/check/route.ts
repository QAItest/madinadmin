import { generateText } from "ai";
import { modelForAgent } from "../../../../lib/openai";

export async function POST(request: Request) {
  const payload = await request.json();

  const { text } = await generateText({
    model: modelForAgent("controleur"),
    system: "Tu es le Controleur Madin'Admin. Tu audites la conformite. Une alerte rouge bloque la validation. Donnee manquante est une reponse valide.",
    prompt: JSON.stringify(payload, null, 2)
  });

  return Response.json({ agent: "controleur", status: "draft", text });
}