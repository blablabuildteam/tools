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
          // Channel form so bg-bla-blue/40 etc. actually render
          lime: "rgb(206 255 0 / <alpha-value>)",
          blue: "rgb(17 37 255 / <alpha-value>)",
          dark: "rgb(21 31 40 / <alpha-value>)",
          charcoal: "rgb(26 26 26 / <alpha-value>)",
          "charcoal-light": "rgb(42 42 42 / <alpha-value>)",
          "charcoal-border": "rgb(51 51 51 / <alpha-value>)",
          gray: "rgb(249 250 251 / <alpha-value>)",
          "gray-light": "rgb(243 244 246 / <alpha-value>)",
          border: "rgb(229 231 235 / <alpha-value>)",
          "text-light": "rgb(229 229 229 / <alpha-value>)",
          "text-muted": "rgb(153 153 153 / <alpha-value>)",
          lavender: "rgb(231 232 255 / <alpha-value>)",
          white: "rgb(251 252 250 / <alpha-value>)",
          "text-gray": "rgb(158 158 150 / <alpha-value>)",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(206, 255, 0, 0.12)",
        "glow-blue": "0 0 80px rgba(17, 37, 255, 0.35)",
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
