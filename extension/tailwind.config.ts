import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./sidepanel/index.html", "./sidepanel/src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#e2e8f0",
        mint: "#34d399",
        coral: "#fb7185"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
