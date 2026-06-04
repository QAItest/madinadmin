import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        "surface-container": "var(--surface-container)",
        "surface-high": "var(--surface-high)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        primary: "var(--primary)",
        secondary: "var(--color-secondary)",
        cta: "var(--color-cta)",
        lagoon: "var(--lagoon)",
        leaf: "var(--leaf)",
        gold: "var(--gold)",
        coral: "var(--coral)"
      },
      borderRadius: {
        app: "var(--radius)"
      },
      fontFamily: {
        ui: ["Source Sans 3", "Segoe UI", "Arial", "sans-serif"],
        display: ["Lexend", "Segoe UI", "Arial", "sans-serif"],
        mono: ["Cascadia Code", "Lucida Console", "monospace"]
      },
      maxWidth: {
        shell: "1200px"
      },
      boxShadow: {
        none: "none"
      }
    }
  },
  plugins: []
};

export default config;
