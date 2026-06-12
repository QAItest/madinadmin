import puppeteer from "puppeteer";
import type { Livrable, Porteur } from "./types";

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripMarkdownResidues(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^>\s*/, "")
    .replace(/^[-*]\s+\[[ xX]\]\s+/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, "$1")
    .replace(/[`*_~#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inlineMarkdown(value: string) {
  const normalized = stripMarkdownResidues(value);
  return escapeHtml(normalized)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 <span class="link-reference">$2</span>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/(^|\s)[*_]{1,3}(\s|$)/g, "$1$2")
    .replace(/\\([\\`*_[\]{}()#+\-.!|>])/g, "$1");
}

function madinLogoSvg() {
  return `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="4" y="4" width="56" height="56" rx="16" fill="#003b71" />
    <path d="M13 38c6.5-8.5 13.1-8.8 19.8-.9 5.9 6.9 12 6.5 18.2-1.1" fill="none" stroke="#7ddde8" stroke-width="4.5" stroke-linecap="round" />
    <path d="M34 16c8.8 1.2 13.7 6.4 14.7 15.6C39.9 30.8 35 25.6 34 16Z" fill="#76c893" />
    <path d="M22 18h10M22 25h8M22 32h18" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" />
    <circle cx="48" cy="18" r="4" fill="#d9a441" />
  </svg>`;
}

function tableCells(line: string) {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line?: string) {
  if (!line) return false;
  return /^(\s*\|)?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+(\|\s*)?$/.test(line);
}

function markdownBody(markdown: string) {
  const source = markdown.replace(/^\uFEFF?\s*---[\s\S]*?---\s*/, "").trim();
  const lines = source.split(/\r?\n/);
  const html: string[] = [];
  let listOpen: "ul" | "ol" | undefined;
  let codeOpen = false;
  let paragraphBuffer: string[] = [];

  function closeList() {
    if (!listOpen) return;
    html.push(`</${listOpen}>`);
    listOpen = undefined;
  }

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    html.push(`<p>${inlineMarkdown(paragraphBuffer.join(" "))}</p>`);
    paragraphBuffer = [];
  }

  function closeFlow() {
    flushParagraph();
    closeList();
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      closeFlow();
      if (codeOpen) {
        codeOpen = false;
      } else {
        codeOpen = true;
      }
      continue;
    }

    if (codeOpen) {
      if (trimmed) html.push(`<p class="technical-note">${inlineMarkdown(line)}</p>`);
      continue;
    }

    if (!trimmed) {
      closeFlow();
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closeFlow();
      html.push("<hr />");
      continue;
    }

    if (isTableDivider(trimmed)) {
      closeFlow();
      continue;
    }

    if (trimmed.includes("|") && isTableDivider(lines[index + 1])) {
      closeFlow();
      const headers = tableCells(trimmed);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      index -= 1;
      html.push("<table>");
      html.push(`<thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`);
      html.push("<tbody>");
      for (const row of rows) {
        html.push(`<tr>${headers.map((_, cellIndex) => `<td>${inlineMarkdown(row[cellIndex] ?? "")}</td>`).join("")}</tr>`);
      }
      html.push("</tbody></table>");
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeFlow();
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const quote = /^>\s+(.+)$/.exec(trimmed);
    if (quote) {
      closeFlow();
      html.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    const task = /^[-*]\s+\[([ xX])\]\s+(.+)$/.exec(trimmed);
    if (task) {
      flushParagraph();
      if (listOpen !== "ul") {
        closeList();
        html.push('<ul class="task-list">');
        listOpen = "ul";
      }
      const checked = task[1].toLowerCase() === "x";
      html.push(`<li><span class="${checked ? "task-box checked" : "task-box"}" aria-hidden="true">${checked ? "✓" : ""}</span>${inlineMarkdown(task[2])}</li>`);
      continue;
    }

    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      if (listOpen !== "ul") {
        closeList();
        html.push("<ul>");
        listOpen = "ul";
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      flushParagraph();
      if (listOpen !== "ol") {
        closeList();
        html.push("<ol>");
        listOpen = "ol";
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  closeList();
  return html.join("\n");
}

function documentHtml(porteur: Porteur, livrable: Livrable) {
  const generatedAt = new Date().toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short"
  });
  const livrableDate = new Date(livrable.createdAt).toLocaleDateString("fr-FR");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(livrable.title)} - ${escapeHtml(porteur.name)}</title>
  <style>
    @page {
      size: A4;
      margin: 17mm 15mm 22mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #172033;
      background: #ffffff;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11.2pt;
      line-height: 1.62;
    }

    .institution-frame {
      position: relative;
      min-height: 245mm;
    }

    .document-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 2px solid #d8e5ee;
      padding-bottom: 12px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #003b71;
      font-weight: 900;
    }

    .brand-mark {
      width: 38px;
      height: 38px;
      flex: 0 0 auto;
    }

    .brand strong {
      display: block;
      font-size: 16pt;
      line-height: 1;
    }

    .brand span {
      display: block;
      margin-top: 3px;
      color: #0086a6;
      font-size: 7.4pt;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .doc-meta-top {
      color: #526173;
      text-align: right;
      font-size: 7.8pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .hero {
      margin-top: 18px;
      border-radius: 2px;
      background:
        linear-gradient(135deg, #003b71 0%, #005f79 62%, #0086a6 100%);
      color: #ffffff;
      padding: 24px 26px 22px;
    }

    .hero-kicker {
      margin: 0 0 10px;
      color: #d8fbff;
      font-size: 8.2pt;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      max-width: 150mm;
      color: #ffffff;
      font-size: 27pt;
      font-weight: 850;
      line-height: 1.05;
    }

    .subtitle {
      margin: 11px 0 0;
      color: #eefaff;
      font-size: 11.2pt;
      font-weight: 700;
    }

    .document-status {
      display: inline-flex;
      margin-top: 16px;
      border: 1px solid rgba(255, 255, 255, 0.52);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      padding: 5px 10px;
      font-size: 7.8pt;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      margin: 16px 0 18px;
      border: 1px solid #cbd5e1;
      background: #eef5f8;
      padding: 9px;
    }

    .meta div {
      min-height: 39px;
      border-left: 4px solid #0086a6;
      background: #ffffff;
      padding: 7px 9px;
    }

    .meta span {
      display: block;
      color: #586779;
      font-size: 7.2pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.075em;
    }

    .meta strong {
      display: block;
      margin-top: 2px;
      color: #172033;
      font-size: 9.7pt;
    }

    .notice {
      margin: 0 0 18px;
      border: 1px solid #f0d58a;
      border-left: 5px solid #d9a441;
      background: #fffbeb;
      padding: 9px 12px;
      color: #4b3710;
      font-size: 9pt;
      font-weight: 650;
    }

    main {
      padding-top: 2px;
      font-family: Georgia, "Times New Roman", serif;
    }

    main > h2:first-child {
      margin-top: 8px;
    }

    h2 {
      margin: 16px 0 8px;
      break-after: avoid;
      color: #003b71;
      font-family: Aptos, "Segoe UI", Arial, sans-serif;
      font-size: 14.4pt;
      font-weight: 850;
      line-height: 1.2;
      border-bottom: 2px solid #dbe7ef;
      padding: 0 0 5px 10px;
      border-left: 5px solid #0086a6;
    }

    h3 {
      margin: 12px 0 6px;
      break-after: avoid;
      color: #005f79;
      font-family: Aptos, "Segoe UI", Arial, sans-serif;
      font-size: 12.1pt;
      font-weight: 800;
    }

    h4 {
      margin: 12px 0 4px;
      color: #334055;
      font-family: Aptos, "Segoe UI", Arial, sans-serif;
      font-size: 10.8pt;
      font-weight: 850;
    }

    p {
      margin: 0 0 8px;
      text-align: left;
    }

    ul,
    ol {
      margin: 0 0 10px 16px;
      padding: 0;
    }

    .task-list {
      margin-left: 0;
      list-style: none;
    }

    li {
      margin: 0 0 5px;
      padding-left: 2px;
    }

    .task-list li {
      display: grid;
      grid-template-columns: 14px minmax(0, 1fr);
      gap: 7px;
      align-items: start;
      padding-left: 0;
    }

    .task-box {
      display: inline-grid;
      width: 11px;
      height: 11px;
      margin-top: 3px;
      place-items: center;
      border: 1.4px solid #0086a6;
      border-radius: 2px;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 900;
      line-height: 1;
    }

    .task-box.checked {
      background: #0086a6;
    }

    table {
      width: 100%;
      margin: 10px 0 14px;
      border-collapse: collapse;
      break-inside: avoid;
      font-size: 8.8pt;
    }

    th {
      background: #003b71;
      color: #ffffff;
      font-weight: 850;
      text-align: left;
    }

    th,
    td {
      border: 1px solid #cbd5e1;
      padding: 7px 8px;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    blockquote {
      margin: 10px 0 12px;
      border-left: 5px solid #d9a441;
      background: #fffbeb;
      color: #4b3710;
      padding: 9px 12px;
      font-weight: 650;
    }

    .technical-note {
      border-left: 4px solid #0086a6;
      background: #f8fafc;
      padding: 8px 10px;
      color: #334155;
      font-family: Georgia, "Times New Roman", serif;
    }

    .link-reference {
      color: #526173;
      font-size: 8.2pt;
      overflow-wrap: anywhere;
    }

    hr {
      height: 1px;
      margin: 14px 0;
      border: 0;
      background: #dbe4ef;
    }

    footer {
      position: fixed;
      right: 16mm;
      bottom: 8mm;
      left: 16mm;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      color: #64748b;
      font-size: 8pt;
    }

    .page-number::after {
      content: counter(page);
    }
  </style>
</head>
<body>
  <div class="institution-frame">
  <section class="cover">
    <div class="document-header">
      <div class="brand">
        ${madinLogoSvg()}
        <div>
          <strong>Madin'Admin</strong>
          <span>FEDER - Agir Plus</span>
        </div>
      </div>
      <div class="doc-meta-top">
        <div>Livrable institutionnel</div>
        <div>Référence ${escapeHtml(porteur.id)} / ${escapeHtml(livrable.agent)}</div>
      </div>
    </div>
    <div class="hero">
      <p class="hero-kicker">Document de travail opérateur</p>
      <h1>${escapeHtml(livrable.title)}</h1>
      <p class="subtitle">${escapeHtml(porteur.name)} - ${escapeHtml(porteur.dispositif)}</p>
      <span class="document-status">À relire avant transmission</span>
    </div>
    <section class="meta" aria-label="Informations du dossier">
      <div><span>Porteur</span><strong>${escapeHtml(porteur.name)}</strong></div>
      <div><span>Structure</span><strong>${escapeHtml(porteur.structure)}</strong></div>
      <div><span>Module</span><strong>${escapeHtml(porteur.module === "energie" ? "Madin'Énergie / Agir Plus" : "Financement de projet / FEDER")}</strong></div>
      <div><span>Budget déclaré</span><strong>${escapeHtml(porteur.budget || "Non renseigné")}</strong></div>
      <div><span>Date du livrable</span><strong>${escapeHtml(livrableDate)}</strong></div>
      <div><span>Généré le</span><strong>${escapeHtml(generatedAt)}</strong></div>
    </section>
    <p class="notice">Document de travail à relire et valider par l'opérateur avant transmission ou dépôt officiel.</p>
  </section>
  <main>
    ${markdownBody(livrable.content)}
  </main>
  <footer>
    <span>Madin'Admin - ${escapeHtml(porteur.id)}</span>
    <span>Page <span class="page-number"></span> - Document interne / export PDF</span>
  </footer>
  </div>
</body>
</html>`;
}

export async function renderLivrablePdf(porteur: Porteur, livrable: Livrable) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(documentHtml(porteur, livrable), { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }
}
