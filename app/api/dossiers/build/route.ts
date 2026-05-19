import { generateText } from "ai";
import { modelForAgent } from "../../../../lib/openai";

export async function POST(request: Request) {
  const payload = await request.json();

  const { text } = await generateText({
    model: modelForAgent("monteur"),
    system: "Tu es le Monteur Madin'Admin. Tu rediges un dossier administratif structure, avec indicateurs SMART et sources explicites. N'invente aucune donnee.",
    prompt: JSON.stringify(payload, null, 2)
  });

  return Response.json({ agent: "monteur", status: "draft", text });
}