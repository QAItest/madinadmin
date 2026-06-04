import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stitch, StitchError } from "@google/stitch-sdk";

const hasCredentials = Boolean(process.env.STITCH_API_KEY || (process.env.STITCH_ACCESS_TOKEN && process.env.GOOGLE_CLOUD_PROJECT));

if (!hasCredentials) {
  console.error("Google Stitch n'est pas configure.");
  console.error("Ajoutez STITCH_API_KEY dans .env.local ou exportez la variable avant d'executer ce script.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportDir = join(process.cwd(), "reports", "stitch");
const projectTitle = `MadinAdmin UX ${timestamp}`;

const basePrompt = `
Design a production-ready screen for Madin'Admin, a French ultramarine public-aid platform.
Audience: households, small businesses, associations, local authorities and consultants in Martinique.
Scope: permanent FEDER project funding and EDF Agir Plus energy-transition aids.
Visual style: inspired by French public-service portals such as impots.gouv, but do not use the French Republic logo, Marianne, flags, or official government marks.
Brand: Madin'Admin with a compact abstract ultramarine emblem, deep navy, lagoon cyan, tropical green, restrained gold, excellent contrast in both dark and light mode.
Layout requirements:
- institutional two-level header with logo/account/search/actions on top and navigation bar below;
- clear entry paths for "Je finance un projet structurant" and "Je reduis une facture d'energie";
- accessible cards, strong hierarchy, no AI-related wording;
- snackbar-style status notification near the bottom;
- premium admin dashboard feel, not a marketing landing page.
Text language: French.
`;

async function generateScreen(project, deviceType) {
  const prompt = `${basePrompt}\nDevice target: ${deviceType}. Optimize spacing, navigation and card density for this device.`;
  const screen = await project.generate(prompt, deviceType, "GEMINI_3_FLASH");
  return {
    deviceType,
    screenId: screen.screenId,
    htmlUrl: await screen.getHtml(),
    imageUrl: await screen.getImage()
  };
}

try {
  await mkdir(reportDir, { recursive: true });

  const project = await stitch.createProject(projectTitle);
  const screens = [];
  screens.push(await generateScreen(project, "DESKTOP"));
  screens.push(await generateScreen(project, "MOBILE"));

  const report = {
    generatedAt: new Date().toISOString(),
    projectTitle,
    projectId: project.projectId,
    screens
  };

  const jsonPath = join(reportDir, `madin-admin-stitch-${timestamp}.json`);
  const mdPath = join(reportDir, `madin-admin-stitch-${timestamp}.md`);

  await writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
  await writeFile(
    mdPath,
    [
      `# Google Stitch - ${projectTitle}`,
      "",
      `Project ID: \`${project.projectId}\``,
      "",
      ...screens.flatMap((screen) => [
        `## ${screen.deviceType}`,
        "",
        `- Screen ID: \`${screen.screenId}\``,
        `- HTML: ${screen.htmlUrl}`,
        `- Image: ${screen.imageUrl}`,
        ""
      ])
    ].join("\n"),
    "utf8"
  );

  console.log(`Projet Stitch cree: ${project.projectId}`);
  console.log(`Rapport JSON: ${jsonPath}`);
  console.log(`Rapport Markdown: ${mdPath}`);
} catch (error) {
  if (error instanceof StitchError) {
    console.error(`Erreur Stitch ${error.code}: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
}
