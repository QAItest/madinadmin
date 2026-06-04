import { generateText } from "ai";
import { reviewLivrableWithAnthropic } from "./anthropic";
import { modelForAgent } from "./openai";
import { getPorteur, readLivrables, renderFrontmatter, writeLivrable } from "./store";
import type { AgentKey, Livrable, Porteur } from "./types";
import { workflowTitle } from "./workflow";

const systems: Record<AgentKey, string> = {
  diagnostiqueur:
    "Tu es le Diagnostiqueur Madin'Admin. Analyse eligibilite, cadrage et donnees manquantes. Non eligible est une reponse valide. N'invente rien.",
  monteur:
    "Tu es le Monteur Madin'Admin. Redige les sections du dossier avec logique d'intervention, cadre logique et indicateurs SMART raccordes au dispositif.",
  documentaliste:
    "Tu es le Documentaliste Madin'Admin. Produis la checklist des pieces, signale les validites critiques et les pieces manquantes.",
  controleur:
    "Tu es le Controleur Madin'Admin. Audite coherence, budget, indicateurs, signatures et obligations. Une alerte rouge bloque la validation.",
  suiveur:
    "Tu es le Suiveur Madin'Admin. Organise journal post-depot, demandes de pieces, echeances et alertes 15/7/2 jours.",
  archiviste:
    "Tu es l'Archiviste Madin'Admin. Produis reporting, tracabilite decisionnelle et dossier de preuve conservable."
};

function isEnergyDossier(porteur: Porteur) {
  return (
    porteur.module === "energie" ||
    /energie|agir plus|edf/i.test(`${porteur.dispositif} ${porteur.project}`)
  );
}

function localDraft(porteur: Porteur, agent: AgentKey, livrables: Livrable[]) {
  const previous = livrables.map((item) => `- ${item.title}: ${item.path}`).join("\n") || "- Aucun livrable precedent.";
  const energy = isEnergyDossier(porteur);

  const common = `${renderFrontmatter(porteur, agent)}\n\n# ${workflowTitle(agent)}\n\n## Sources lues\n\n- Profil porteur: porteurs/${porteur.id}/profil.md\n${previous}\n\n## Donnees porteur\n\n- Module: ${energy ? "Madin'Energie" : "Financement de projet"}\n- Structure: ${porteur.structure || "Donnee manquante"}\n- Territoire: ${porteur.territory || "Donnee manquante"}\n- Projet: ${porteur.project || "Donnee manquante"}\n- Dispositif vise: ${porteur.dispositif || "Donnee manquante"}\n- Budget declare: ${porteur.budget || "Donnee manquante"}\n- Date cible: ${porteur.deadline || "Donnee manquante"}\n`;

  if (energy) {
    if (agent === "diagnostiqueur") {
      return `${common}\n## Diagnostic energetique simple\n\nStatut provisoire: a qualifier.\n\nLe dossier Madin'Energie doit d'abord identifier le profil d'usage, le type de batiment, les postes de consommation et les travaux envisages. Les aides EDF Agir Plus applicables ne doivent pas etre confirmees sans fiche d'offre a jour, devis et conditions d'eligibilite verifiees.\n\n## Donnees manquantes\n\n- Factures EDF recentes ou historique de consommation.\n- Type de local: logement, commerce, hotel, industrie, collectivite ou bailleur.\n- Surface, usages principaux et equipements existants.\n- Travaux envisages: climatisation performante, isolation, solaire, renovation, eau chaude, pilotage ou autre.\n- Devis ou contact d'un installateur local qualifie.\n\n## Prochaines actions\n\n1. Qualifier le batiment et les usages.\n2. Collecter factures, photos, devis et fiches techniques.\n3. Verifier l'offre Agir Plus applicable avant toute estimation de prime.\n`;
    }

    if (agent === "monteur") {
      return `${common}\n## Parcours aides energie\n\nObjectif: preparer un dossier d'aide a la maitrise de l'energie pour reduire la facture et financer des equipements performants.\n\n## Simulation a completer\n\n- Montant potentiel de prime: a calculer apres verification de la fiche Agir Plus applicable.\n- Economies estimees: a etablir a partir de la consommation actuelle, de l'equipement remplace et du devis.\n- Reste a charge: budget declare moins aides confirmees et cofinancements eventuels.\n\n## Sections du dossier\n\n### Situation initiale\n\nConsommations, contraintes du batiment, usages, inconfort ou surcouts constates.\n\n### Travaux envisages\n\nEquipement, performance attendue, installateur, calendrier et garanties.\n\n### Gains attendus\n\nEconomies d'energie, baisse de facture, confort, maintenance et impact environnemental.\n\n## Points de vigilance\n\nAucun montant de prime ne doit etre presente comme acquis sans confirmation officielle et pieces justificatives.\n`;
    }

    if (agent === "documentaliste") {
      return `${common}\n## Checklist Madin'Energie\n\n- Piece d'identite ou justificatif legal de la structure.\n- Justificatif d'adresse du site concerne.\n- Factures EDF recentes.\n- RIB.\n- Devis detaille de l'installateur.\n- Fiche technique des equipements proposes.\n- Photos de l'existant si disponibles.\n- Attestation ou qualification de l'installateur si exigee par l'offre.\n- Facture acquittee et attestation de fin de travaux apres realisation.\n\n## Pieces specifiques professionnels\n\n- K-bis, SIRET ou justificatif d'activite.\n- Autorisation du proprietaire ou mandat si le demandeur n'est pas proprietaire.\n- Donnees de consommation du local ou batiment.\n`;
    }

    if (agent === "controleur") {
      return `${common}\n## Synthese de conformite energie\n\nStatut: orange.\n\n## Controles\n\n- Coherence besoin/travaux: orange, usage du batiment a documenter.\n- Offre Agir Plus applicable: orange, fiche d'offre a joindre.\n- Devis et equipement: orange, performances et references a verifier.\n- Installateur: orange, qualification ou partenariat local a confirmer.\n- Preuves post-travaux: orange, facture et attestation indispensables.\n\n## Decision\n\nValidation impossible tant que l'offre applicable, le devis et les justificatifs ne sont pas confirmes.\n`;
    }

    if (agent === "suiveur") {
      return `${common}\n## Suivi du dossier energie\n\nAucun depot ou versement declare dans la plateforme.\n\n## Jalons\n\n- Diagnostic et collecte des consommations.\n- Choix de l'offre Agir Plus applicable.\n- Devis valide par le demandeur.\n- Realisation des travaux.\n- Depot des justificatifs finaux.\n- Suivi du versement de la prime.\n\n## Rappels\n\nProgrammer des relances pour devis, facture, attestation de fin de travaux et verification du versement.\n`;
    }

    return `${common}\n## Dossier de preuve energie\n\nLe dossier de preuve doit conserver les factures EDF, devis, fiches techniques, photos, attestations, factures acquittees, preuves de depot et notifications de prime.\n\n## Tableau de bord economique\n\n- Economies estimees: a calculer apres diagnostic.\n- Prime estimee: a confirmer par fiche officielle.\n- Reste a charge: a calculer apres devis et aide confirmee.\n- Statut versement: non renseigne.\n\n## Tracabilite\n\nChaque economie annoncee doit pointer vers une hypothese, une facture ou une piece source.\n`;
  }

  if (agent === "diagnostiqueur") {
    return `${common}\n## Analyse d'eligibilite\n\nStatut provisoire: a qualifier.\n\nLe dossier peut etre instruit seulement apres verification des criteres durs du dispositif vise, de la zone d'eligibilite, du calendrier, du regime d'aide applicable et des justificatifs juridiques du porteur.\n\n## Donnees manquantes\n\n- Texte officiel de l'appel a projets ou fiche dispositif applicable.\n- Statuts juridiques verifies du porteur.\n- Budget detaille par poste et devis associes.\n- Plan de financement et cofinancements confirmes.\n\n## Prochaines actions\n\n1. Joindre la fiche dispositif.\n2. Completer les statuts et pieces administratives.\n3. Valider le budget eligible avant redaction du dossier.\n`;
  }

  if (agent === "monteur") {
    return `${common}\n## Cadre methodologique\n\nLogique d'intervention europeenne, cadre logique, theorie du changement et approche par resultats.\n\n## Sections a produire\n\n### Description du projet\n\n${porteur.project || "Donnee manquante"}\n\n### Objectifs operationnels\n\n- Objectif 1: a raccorder explicitement a l'axe du programme.\n- Objectif 2: a confirmer avec le porteur.\n\n### Indicateurs SMART\n\n- Indicateur de realisation: donnee cible a confirmer.\n- Indicateur de resultat: methode de mesure a documenter.\n\n## Points de vigilance\n\nAucun indicateur ne doit rester \"a definir\" avant depot. Les montants doivent etre justifies par pieces.\n`;
  }

  if (agent === "documentaliste") {
    return `${common}\n## Checklist personnalisee\n\n- K-bis ou recepisse association selon structure.\n- Statuts a jour.\n- RIB.\n- Attestations fiscales et sociales a jour.\n- Devis comparatifs pour les postes budgetaires.\n- Lettres d'engagement des cofinanceurs.\n- Calendrier previsionnel.\n\n## Pieces a renouveler ou verifier\n\n- Attestations dont la validite expire avant la date de depot cible.\n- Signatures et pouvoirs des representants habilites.\n`;
  }

  if (agent === "controleur") {
    return `${common}\n## Synthese de conformite\n\nStatut: orange.\n\n## Controles\n\n- Coherence budget/calendrier: orange, budget detaille requis.\n- Indicateurs/objectifs: orange, rattachement au programme a documenter.\n- Publicite europeenne: orange, mentions et logos a confirmer.\n- Signatures: orange, pouvoir du signataire a verifier.\n\n## Plan de remediation\n\n- Responsable porteur: fournir budget detaille et pieces justificatives.\n- Responsable Madin'Admin: rattacher chaque indicateur a l'objectif du programme.\n- Delai: avant toute validation pre-depot.\n\n## Decision\n\nValidation impossible tant que les alertes orange ne sont pas levees.\n`;
  }

  if (agent === "suiveur") {
    return `${common}\n## Journal de suivi\n\nAucun depot declare dans la plateforme.\n\n## Echeances\n\n- J-15: verifier completude des pieces.\n- J-7: relance porteur sur pieces manquantes.\n- J-2: controle final avant depot par le porteur.\n\n## Regle\n\nLe depot reste effectue par le porteur. Toute demande complementaire sera historisee.\n`;
  }

  return `${common}\n## Dossier de preuve\n\nLe dossier de preuve sera constitue a partir des livrables valides, pieces justificatives, controles, journaux d'echange et rapports.\n\n## Conservation\n\nConserver les preuves et versions pendant la duree legale applicable aux fonds europeens.\n\n## Tracabilite\n\nChaque decision doit pointer vers le livrable source et la piece justificative associee.\n`;
}

export async function runAgent(porteurId: string, agent: AgentKey) {
  const porteur = await getPorteur(porteurId);
  if (!porteur) {
    throw new Error("Porteur introuvable");
  }

  const livrables = await readLivrables(porteur.id);
  let content: string;
  const frontmatter = renderFrontmatter(porteur, agent);

  if (process.env.OPENAI_API_KEY) {
    const prompt = {
      porteur,
      livrables: livrables.map((item) => ({
        agent: item.agent,
        title: item.title,
        path: item.path,
        excerpt: item.content.slice(0, 5000)
      })),
      output_contract:
        isEnergyDossier(porteur)
          ? "Retourne un livrable Markdown complet pour le module Madin'Energie avec sections Sources lues, Diagnostic energie, Aides applicables, Pieces, Points de vigilance et Prochaines actions. Ne jamais inventer de montant de prime ou de critere EDF. Inclure le frontmatter YAML fourni sans le modifier."
          : "Retourne un livrable Markdown complet avec sections Sources lues, Analyse, Points de vigilance et Prochaines actions. Inclure le frontmatter YAML fourni sans le modifier.",
      frontmatter
    };

    try {
      const result = await generateText({
        model: modelForAgent(agent),
        system: systems[agent],
        prompt: JSON.stringify(prompt, null, 2)
      });
      content = result.text.startsWith("---") ? result.text : `${frontmatter}\n\n${result.text}`;
    } catch {
      content = localDraft(porteur, agent, livrables);
    }
  } else {
    content = localDraft(porteur, agent, livrables);
  }

  content = await reviewLivrableWithAnthropic({ agent, content, frontmatter, porteur });

  return writeLivrable(porteur, agent, content);
}
