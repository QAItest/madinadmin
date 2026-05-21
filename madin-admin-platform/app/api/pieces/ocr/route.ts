import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    // Forward multipart form data as-is
    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/pieces/ocr`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type — let fetch set it with the correct boundary
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /pieces/ocr]", error);
    return NextResponse.json(
      { error: "Erreur de connexion au backend FastAPI." },
      { status: 503 }
    );
  }
}