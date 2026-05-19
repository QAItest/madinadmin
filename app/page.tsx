const agents = [
  ["Diagnostiqueur", "Eligibilite et cadrage du dispositif"],
  ["Monteur", "Redaction section par section"],
  ["Documentaliste", "Checklist des pieces justificatives"],
  ["Controleur", "Audit pre-depot et plan de remediation"],
  ["Suiveur", "Journal post-depot et echeances"],
  ["Archiviste", "Rapports et dossier de preuve"]
];

const workflow = [
  ["J-60", "Diagnostic d'eligibilite argumente"],
  ["J-45", "Montage du dossier et iterations porteur"],
  ["J-30", "Collecte documentaire et validite des pieces"],
  ["J-10", "Controle de conformite complet"],
  ["J+0", "Depot par le porteur et suivi des echanges"],
  ["J+90", "Rapport intermediaire et archivage"]
];

export default function HomePage() {
  return (
    <main>
      <header>
        <div>
          <h1>Madin'Admin Platform</h1>
          <p>Dashboard de pilotage pour une chaine administrative multi-agent FEDER, FSE+ et dispositifs publics ultramarins.</p>
        </div>
        <span className="badge">Prototype interne</span>
      </header>

      <section className="grid" aria-label="Agents">
        {agents.map(([name, role]) => (
          <article className="card" key={name}>
            <h2>{name}</h2>
            <p>{role}</p>
          </article>
        ))}
      </section>

      <section className="timeline" aria-label="Workflow FEDER">
        {workflow.map(([date, text]) => (
          <div className="step" key={date}>
            <strong>{date}</strong>
            <span>{text}</span>
          </div>
        ))}
      </section>
    </main>
  );
}