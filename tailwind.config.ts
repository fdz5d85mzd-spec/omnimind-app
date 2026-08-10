import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e2e",
        card: "#12163f",
        card2: "#171c4d",
        primary: "#1e2761",
        accent: "#5b6ef5",
        cyan: "#22d3ee",
        muted: "#9ca3d4",
        mutedDark: "#6b72a8",
      },
      fontFamily: {
        head: ["Cambria", "Georgia", "serif"],
        body: ["Calibri", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
