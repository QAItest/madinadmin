from fastapi import FastAPI
from api.routers import conformite, diagnostics, dossiers, integrations

app = FastAPI(title="Madin'Admin API", version="0.1.0")

app.include_router(diagnostics.router, prefix="/api/diagnostics", tags=["diagnostics"])
app.include_router(dossiers.router, prefix="/api/dossiers", tags=["dossiers"])
app.include_router(conformite.router, prefix="/api/conformite", tags=["conformite"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}