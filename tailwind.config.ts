import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06071a",
        card: "#12163f",
        card2: "#171c4d",
        primary: "#1e2761",
        accent: "#5b6ef5",
        cyan: "#22d3ee",
        violet: "#a855f7",
        emerald: "#34d399",
        amber: "#fbbf24",
        crimson: "#f87171",
        muted: "#9ca3d4",
        mutedDark: "#6b72a8",
      },
      fontFamily: {
        head: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,110,245,0.5), 0 8px 30px -6px rgba(91,110,245,0.45)",
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 60px -20px rgba(0,0,0,0.6)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease-out",
        popIn: "popIn 0.15s ease-out",
        rise: "rise 0.6s cubic-bezier(0.16,1,0.3,1) both",
        breathe: "breathe 4s ease-in-out infinite",
        pulseDot: "pulseDot 2s ease-in-out infinite",
        orbit: "orbit 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
