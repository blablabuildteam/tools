import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        host: ["Host Grotesk", "system-ui", "sans-serif"],
        sans: ["Host Grotesk", "system-ui", "sans-serif"],
        display: ["Host Grotesk", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        bla: {
          lime: "var(--bla-lime)",
          blue: "var(--bla-blue)",
          dark: "var(--bla-dark)",
          charcoal: "var(--bla-charcoal)",
          "charcoal-light": "var(--bla-charcoal-light)",
          "charcoal-border": "var(--bla-charcoal-border)",
          gray: "var(--bla-gray)",
          "gray-light": "var(--bla-gray-light)",
          border: "var(--bla-border)",
          "text-light": "var(--bla-text-light)",
          "text-muted": "var(--bla-text-muted)",
          lavender: "var(--bla-lavender)",
          white: "var(--bla-white)",
          "text-gray": "var(--bla-text-gray)",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(206, 255, 0, 0.12)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
    },
  },
  plugins: [],
};
export default config;
