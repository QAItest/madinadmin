import { createPorteur, getDashboardData } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json(await getDashboardData(url.searchParams.get("selected") ?? undefined));
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || !body.structure || !body.project || !body.dispositif) {
    return Response.json({ error: "Nom, structure, projet et dispositif sont obligatoires." }, { status: 400 });
  }

  const porteur = await createPorteur({
    name: body.name,
    territory: body.territory ?? "",
    structure: body.structure,
    project: body.project,
    dispositif: body.dispositif,
    budget: body.budget ?? "",
    deadline: body.deadline ?? ""
  });

  return Response.json(porteur, { status: 201 });
}
