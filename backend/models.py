"""SQLAlchemy ORM models for Madin'Admin."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class Porteur(Base):
    __tablename__ = "porteurs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    type_structure: Mapped[Optional[str]] = mapped_column(String(100))
    secteur: Mapped[Optional[str]] = mapped_column(String(255))
    territoire: Mapped[Optional[str]] = mapped_column(String(100))
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    dossiers: Mapped[list["Dossier"]] = relationship("Dossier", back_populates="porteur_rel")


class Dossier(Base):
    __tablename__ = "dossiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    porteur_slug: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("porteurs.slug")
    )
    dispositif: Mapped[str] = mapped_column(String(100), nullable=False)
    nom_projet: Mapped[str] = mapped_column(String(500), nullable=False)
    statut: Mapped[str] = mapped_column(String(50), default="diagnostic")
    etape_courante: Mapped[int] = mapped_column(Integer, default=1)
    date_depot_prevue: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    porteur_rel: Mapped[Optional["Porteur"]] = relationship("Porteur", back_populates="dossiers")
    livrables: Mapped[list["Livrable"]] = relationship("Livrable", back_populates="dossier_rel")
    echeances: Mapped[list["Echeance"]] = relationship("Echeance", back_populates="dossier_rel")
    journal_entries: Mapped[list["Journal"]] = relationship("Journal", back_populates="dossier_rel")


class Livrable(Base):
    __tablename__ = "livrables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dossier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("dossiers.id"))
    porteur_slug: Mapped[Optional[str]] = mapped_column(String(100))
    agent: Mapped[str] = mapped_column(String(100), nullable=False)
    type_livrable: Mapped[str] = mapped_column(String(100), nullable=False)
    chemin_fichier: Mapped[Optional[str]] = mapped_column(String(500))
    contenu: Mapped[Optional[str]] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, default=1)
    statut: Mapped[str] = mapped_column(String(50), default="brouillon")
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    dossier_rel: Mapped[Optional["Dossier"]] = relationship("Dossier", back_populates="livrables")


class Echeance(Base):
    __tablename__ = "echeances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dossier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("dossiers.id"))
    porteur_slug: Mapped[Optional[str]] = mapped_column(String(100))
    libelle: Mapped[str] = mapped_column(String(500), nullable=False)
    date_echeance: Mapped[date] = mapped_column(Date, nullable=False)
    jours_alerte: Mapped[list[int]] = mapped_column(ARRAY(Integer), default=lambda: [15, 7, 2])
    alerte_envoyee: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    dossier_rel: Mapped[Optional["Dossier"]] = relationship("Dossier", back_populates="echeances")


class Journal(Base):
    __tablename__ = "journal"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dossier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("dossiers.id"))
    porteur_slug: Mapped[Optional[str]] = mapped_column(String(100))
    agent: Mapped[Optional[str]] = mapped_column(String(100))
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text)
    version_avant: Mapped[Optional[int]] = mapped_column(Integer)
    version_apres: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    dossier_rel: Mapped[Optional["Dossier"]] = relationship("Dossier", back_populates="journal_entries")
