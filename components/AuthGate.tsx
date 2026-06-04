"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { HeaderActionsProvider } from "./HeaderActionsContext";
import { MadinLogoMark } from "./MadinLogoMark";

type Props = {
  children: ReactNode;
};

const sessionKey = "madin-admin-authenticated";
const themeKey = "madin-admin-theme";

export function AuthGate({ children }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const storedTheme = sessionStorage.getItem(themeKey) === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = storedTheme;
    setTheme(storedTheme);
    setIsAuthenticated(sessionStorage.getItem(sessionKey) === "true");
    setIsReady(true);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!email || !password) {
      setError("Email et mot de passe obligatoires.");
      return;
    }

    sessionStorage.setItem(sessionKey, "true");
    setIsAuthenticated(true);
    setError(undefined);
  }

  function logout() {
    sessionStorage.removeItem(sessionKey);
    setIsAuthenticated(false);
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    sessionStorage.setItem(themeKey, nextTheme);
    setTheme(nextTheme);
  }

  const themeToggle = (
    <button
      className="theme-switch"
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={`Thème ${theme === "dark" ? "sombre" : "clair"} actif. Changer de thème.`}
      onClick={toggleTheme}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-icon theme-switch-sun">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 4V2M12 22v-2M20 12h2M2 12h2M18.36 5.64l1.42-1.42M4.22 19.78l1.42-1.42M18.36 18.36l1.42 1.42M4.22 4.22l1.42 1.42" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </span>
        <span className="theme-switch-thumb" />
        <span className="theme-switch-icon theme-switch-moon">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M20.5 15.5A8.6 8.6 0 0 1 8.5 3.5a7.2 7.2 0 1 0 12 12Z" />
          </svg>
        </span>
      </span>
      <span className="sr-only">{theme === "dark" ? "Thème sombre" : "Thème clair"}</span>
    </button>
  );

  if (!isReady) {
    return (
      <main className="auth-shell" aria-busy="true" aria-live="polite">
        <p className="sr-only">Chargement de Madin'Admin.</p>
      </main>
    );
  }

  if (isAuthenticated) {
    const headerActions = (
      <>
        {themeToggle}
        <button className="ghost-button session-button" type="button" onClick={logout} aria-label="Se déconnecter">
          Se déconnecter
        </button>
      </>
    );

    return <HeaderActionsProvider actions={headerActions}>{children}</HeaderActionsProvider>;
  }

  return (
    <main className="auth-shell" aria-labelledby="auth-title">
      <header className="site-header auth-site-header" aria-label="En-tête du site">
        <a className="site-logo" href="#auth-title" aria-label="Accueil Madin'Admin">
          <MadinLogoMark />
          <span className="site-logo-text">
            <strong>Madin'Admin</strong>
            <span>FEDER - Agir Plus</span>
          </span>
        </a>
        <nav className="site-nav" aria-label="Navigation avant connexion">
          <a href="#auth-title">Connexion</a>
          <a href="https://www.edf.mq/particulier/realiser-des-economies-d-energie/decouvrir-les-offres-edf-mq" target="_blank" rel="noreferrer" aria-label="Agir Plus EDF, ouvre dans un nouvel onglet">
            Agir Plus <span className="sr-only">(ouvre dans un nouvel onglet)</span>
          </a>
        </nav>
        <div className="site-header-actions" aria-label="Préférences d'affichage">
          {themeToggle}
        </div>
      </header>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-orbit" aria-hidden="true" />
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <MadinLogoMark />
            <strong>Madin'Admin</strong>
          </div>
          <div className="auth-tools">
            <span>Accès sécurisé</span>
          </div>
        </div>

        <div>
          <h1 id="auth-title">Connexion</h1>
          <p>Identifiez-vous pour accéder aux dossiers et aux espaces de suivi.</p>
        </div>

        {error ? (
          <div className="auth-error" id="auth-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="form" onSubmit={handleSubmit} aria-describedby={error ? "auth-error" : undefined}>
          <label>
            Email
            <input name="email" required autoComplete="email" placeholder="nom@organisation.fr" type="email" />
          </label>
          <label>
            Mot de passe
            <input name="password" required autoComplete="current-password" placeholder="Votre mot de passe" type="password" />
          </label>
          <button type="submit">Entrer dans Madin'Admin</button>
        </form>
      </section>
      <footer className="site-footer auth-site-footer">
        <div>
          <strong>Madin'Admin</strong>
          <p>Portail d'orientation pour subventions FEDER et aides Agir Plus. Les informations sont indicatives et doivent être vérifiées avec les fiches officielles.</p>
        </div>
        <nav aria-labelledby="auth-footer-portal">
          <h2 id="auth-footer-portal">Portail</h2>
          <a href="#auth-title">Accès sécurisé</a>
          <a href="https://www.aread.eu/2025/12/09/guide-feder-2026/" target="_blank" rel="noreferrer" aria-label="Guide FEDER, ouvre dans un nouvel onglet">
            Guide FEDER <span className="sr-only">(ouvre dans un nouvel onglet)</span>
          </a>
        </nav>
        <nav aria-labelledby="auth-footer-data">
          <h2 id="auth-footer-data">Données</h2>
          <a href="#auth-confidentialite">Confidentialité</a>
          <a href="#auth-retention">Conservation limitée</a>
          <a href="#auth-suppression">Suppression des données</a>
        </nav>
        <section className="compliance-note" aria-label="Informations de conformité avant connexion">
          <h2 id="auth-confidentialite">Confidentialité et droits</h2>
          <ul>
            <li id="auth-retention">
              <strong>Conservation limitée.</strong> Les données de simulation doivent être gardées seulement le temps nécessaire à l'orientation.
            </li>
            <li id="auth-suppression">
              <strong>Accès et suppression.</strong> Le porteur doit pouvoir demander l'accès, la correction ou l'effacement des informations le concernant.
            </li>
          </ul>
        </section>
        <small>Aucun dépôt automatique, aucune signature à la place du porteur.</small>
      </footer>
    </main>
  );
}
