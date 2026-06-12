import { renderLivrablePdf } from "../../../../lib/livrable-pdf";
import { getPorteur, readLivrables } from "../../../../lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizedPath(value: string) {
  return value.replace(/\\/g, "/");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const porteurId = url.searchParams.get("porteurId") ?? "";
  const livrablePath = url.searchParams.get("path") ?? "";

  if (!porteurId || !livrablePath) {
    return Response.json({ error: "porteurId et path sont obligatoires." }, { status: 400 });
  }

  const porteur = await getPorteur(porteurId);
  if (!porteur) {
    return Response.json({ error: "Porteur introuvable." }, { status: 404 });
  }

  const livrable = (await readLivrables(porteurId)).find((item) => normalizedPath(item.path) === normalizedPath(livrablePath));
  if (!livrable) {
    return Response.json({ error: "Livrable introuvable pour ce porteur." }, { status: 404 });
  }

  try {
    const pdf = await renderLivrablePdf(porteur, livrable);
    const fileName = `${safeFileName(porteur.name)}-${safeFileName(livrable.title)}.pdf`;
    const body = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(body).set(pdf);

    return new Response(body, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${fileName}"`,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Export PDF impossible." },
      { status: 500 }
    );
  }
}
