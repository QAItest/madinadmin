import { DuplicatePieceError, deletePiece, getDashboardData, savePiece } from "../../../../lib/store";
import type { PieceCategory } from "../../../../lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedCategories: PieceCategory[] = [
  "identite",
  "statuts",
  "budget",
  "devis",
  "factures",
  "attestations",
  "technique",
  "rib",
  "autre"
];

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain"
]);

const maxFileSize = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const porteurId = String(formData.get("porteurId") ?? "");
    const category = String(formData.get("category") ?? "") as PieceCategory;
    const file = formData.get("file");

    if (!porteurId) {
      return Response.json({ error: "Le dossier est obligatoire." }, { status: 400 });
    }

    if (!allowedCategories.includes(category)) {
      return Response.json({ error: "La catégorie de pièce est inconnue." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size <= 0) {
      return Response.json({ error: "Aucun fichier valide n'a été transmis." }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return Response.json({ error: "Le fichier dépasse la limite de 20 Mo." }, { status: 413 });
    }

    if (file.type && !allowedMimeTypes.has(file.type)) {
      return Response.json({ error: "Format non accepté. Utilisez PDF, image, Word, Excel, CSV ou texte." }, { status: 415 });
    }

    const piece = await savePiece({
      porteurId,
      category,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      bytes: new Uint8Array(await file.arrayBuffer())
    });

    return Response.json({ piece, dashboard: await getDashboardData(porteurId) }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicatePieceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Upload impossible." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { porteurId?: string; pieceId?: string };

    if (!body.porteurId || !body.pieceId) {
      return Response.json({ error: "porteurId et pieceId sont obligatoires." }, { status: 400 });
    }

    const piece = await deletePiece({ porteurId: body.porteurId, pieceId: body.pieceId });
    return Response.json({ piece, dashboard: await getDashboardData(body.porteurId) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Suppression impossible." },
      { status: 500 }
    );
  }
}
