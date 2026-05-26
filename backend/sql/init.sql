CREATE TABLE IF NOT EXISTS porteurs (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type_structure VARCHAR(100),
    secteur VARCHAR(255),
    territoire VARCHAR(100),
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dossiers (
    id SERIAL PRIMARY KEY,
    porteur_slug VARCHAR(100) REFERENCES porteurs(slug),
    dispositif VARCHAR(100) NOT NULL,
    nom_projet VARCHAR(500) NOT NULL,
    statut VARCHAR(50) DEFAULT 'diagnostic',
    etape_courante INTEGER DEFAULT 1,
    date_depot_prevue DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livrables (
    id SERIAL PRIMARY KEY,
    dossier_id INTEGER REFERENCES dossiers(id),
    porteur_slug VARCHAR(100),
    agent VARCHAR(100) NOT NULL,
    type_livrable VARCHAR(100) NOT NULL,
    chemin_fichier VARCHAR(500),
    contenu TEXT,
    version INTEGER DEFAULT 1,
    statut VARCHAR(50) DEFAULT 'brouillon',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS echeances (
    id SERIAL PRIMARY KEY,
    dossier_id INTEGER REFERENCES dossiers(id),
    porteur_slug VARCHAR(100),
    libelle VARCHAR(500) NOT NULL,
    date_echeance DATE NOT NULL,
    jours_alerte INTEGER[] DEFAULT '{15,7,2}',
    alerte_envoyee BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal (
    id SERIAL PRIMARY KEY,
    dossier_id INTEGER REFERENCES dossiers(id),
    porteur_slug VARCHAR(100),
    agent VARCHAR(100),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    version_avant INTEGER,
    version_apres INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dossiers_porteur ON dossiers(porteur_slug);
CREATE INDEX IF NOT EXISTS idx_livrables_dossier ON livrables(dossier_id);
CREATE INDEX IF NOT EXISTS idx_echeances_dossier ON echeances(dossier_id);
CREATE INDEX IF NOT EXISTS idx_journal_dossier ON journal(dossier_id);
