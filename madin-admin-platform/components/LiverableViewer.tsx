"use client";

import ReactMarkdown from "react-markdown";

interface FrontmatterData {
  porteur?: string;
  dispositif?: string;
  dossier?: string;
  agent?: string;
  date?: string;
  version?: number;
  statut?: string;
  eligibilite?: string;
  decision?: string;
  items_verts?: number;
  items_orange?: number;
  items_rouges?: number;
  [key: string]: string | number | boolean | undefined;
}

interface LiverableViewerProps {
  content: string;
  frontmatter?: FrontmatterData;
  title?: string;
}

function parseFrontmatter(content: string): { data: FrontmatterData; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const yamlBlock = match[1];
  const body = match[2];
  const data: FrontmatterData = {};

  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key && value) {
      const numVal = Number(value);
      data[key] = isNaN(numVal) ? value.replace(/^['"]|['"]$/g, "") : numVal;
    }
  }

  return { data, body };
}

function getStatusColor(statut: string): string {
  const map: Record<string, string> = {
    validé: "bg-green-100 text-green-800 border-green-200",
    brouillon: "bg-slate-100 text-slate-700 border-slate-200",
    "en-révision": "bg-yellow-100 text-yellow-800 border-yellow-200",
    rejeté: "bg-red-100 text-red-800 border-red-200",
    archivé: "bg-gray-100 text-gray-700 border-gray-200",
    VALIDÉ: "bg-green-100 text-green-800 border-green-200",
    REJETÉ: "bg-red-100 text-red-800 border-red-200",
    "EN ATTENTE": "bg-orange-100 text-orange-800 border-orange-200",
  };
  return map[statut] || "bg-slate-100 text-slate-700 border-slate-200";
}

export default function LiverableViewer({ content, title }: LiverableViewerProps) {
  const { data, body } = parseFrontmatter(content);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Frontmatter metadata header */}
      {Object.keys(data).length > 0 && (
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
          {title && (
            <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
          )}
          <div className="flex flex-wrap gap-2">
            {data.porteur && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                Porteur : {data.porteur}
              </span>
            )}
            {data.agent && (
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1">
                Agent : {data.agent}
              </span>
            )}
            {data.dispositif && (
              <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-1">
                {data.dispositif}
              </span>
            )}
            {data.date && (
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1">
                {data.date}
              </span>
            )}
            {data.version !== undefined && (
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1">
                v{data.version}
              </span>
            )}
            {data.statut && (
              <span
                className={`text-xs border rounded-full px-2.5 py-1 font-semibold ${getStatusColor(data.statut)}`}
              >
                {data.statut}
              </span>
            )}
            {data.eligibilite && (
              <span
                className={`text-xs border rounded-full px-2.5 py-1 font-bold ${getStatusColor(data.eligibilite)}`}
              >
                {data.eligibilite}
              </span>
            )}
          </div>

          {/* Conformity scores */}
          {(data.items_verts !== undefined || data.items_rouges !== undefined) && (
            <div className="flex gap-3 mt-3">
              {data.items_verts !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="font-medium text-green-700">{data.items_verts} conformes</span>
                </div>
              )}
              {data.items_orange !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <span className="font-medium text-orange-700">{data.items_orange} majeurs</span>
                </div>
              )}
              {data.items_rouges !== undefined && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="font-medium text-red-700">{data.items_rouges} bloquants</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Markdown body */}
      <div className="p-5">
        <div className="prose prose-slate prose-sm max-w-none
          prose-headings:font-semibold prose-headings:text-slate-900
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-p:text-slate-700 prose-p:leading-relaxed
          prose-li:text-slate-700
          prose-table:text-sm prose-th:bg-slate-50 prose-th:font-semibold
          prose-code:text-xs prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
        ">
          <ReactMarkdown>{body || content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
