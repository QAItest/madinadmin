import { generateText } from "ai";
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

function localDraft(porteur: Porteur, agent: AgentKey, livrables: Livrable[]) {
  const previous = livrables.map((item) => `- ${item.title}: ${item.path}`).join("\n") || "- Aucun livrable precedent.";

  const common = `${renderFrontmatter(porteur, agent)}\n\n# ${workflowTitle(agent)}\n\n## Sources lues\n\n- Profil porteur: porteurs/${porteur.id}/profil.md\n${previous}\n\n## Donnees porteur\n\n- Structure: ${porteur.structure || "Donnee manquante"}\n- Territoire: ${porteur.territory || "Donnee manquante"}\n- Projet: ${porteur.project || "Donnee manquante"}\n- Dispositif vise: ${porteur.dispositif || "Donnee manquante"}\n- Budget declare: ${porteur.budget || "Donnee manquante"}\n- Date cible: ${porteur.deadline || "Donnee manquante"}\n`;

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
        "Retourne un livrable Markdown complet avec sections Sources lues, Analyse, Points de vigilance et Prochaines actions. Inclure le frontmatter YAML fourni sans le modifier.",
      frontmatter: renderFrontmatter(porteur, agent)
    };

    const result = await generateText({
      model: modelForAgent(agent),
      system: systems[agent],
      prompt: JSON.stringify(prompt, null, 2)
    });
    content = result.text.startsWith("---") ? result.text : `${renderFrontmatter(porteur, agent)}\n\n${result.text}`;
  } else {
    content = localDraft(porteur, agent, livrables);
  }

  return writeLivrable(porteur, agent, content);
}
