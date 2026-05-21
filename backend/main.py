"""Madin'Admin — FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import check_db_connection
from backend.api.diagnostics import router as diagnostics_router
from backend.api.dossiers import router as dossiers_router
from backend.api.conformite import router as conformite_router
from backend.api.pieces import router as pieces_router
from backend.api.archives import router as archives_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify DB connectivity."""
    ok = check_db_connection()
    if not ok:
        logger.warning(
            "Could not connect to PostgreSQL at startup. "
            "Run 'docker compose up -d' to start the database."
        )
    yield
    logger.info("Madin'Admin shutting down.")


app = FastAPI(
    title="Madin'Admin API",
    description=(
        "Backend multi-agents pour la gestion des dossiers de subventions "
        "FEDER/FSE+ en Martinique et Guadeloupe."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow Next.js dev server and production origins
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(diagnostics_router, prefix="/api/diagnostics", tags=["Diagnostics"])
app.include_router(dossiers_router, prefix="/api/dossiers", tags=["Dossiers"])
app.include_router(conformite_router, prefix="/api/conformite", tags=["Conformité"])
app.include_router(pieces_router, prefix="/api/pieces", tags=["Pièces & OCR"])
app.include_router(archives_router, prefix="/api/archives", tags=["Archives"])


@app.get("/", tags=["Health"])
def root():
    return {
        "platform": "Madin'Admin",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    db_ok = check_db_connection()
    return {"api": "ok", "database": "ok" if db_ok else "unreachable"}
