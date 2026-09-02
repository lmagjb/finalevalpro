import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1C2B33",
        slate: "#3E5C6B",
        teal: "#0E6E5C",
        paper: "#F6F4EF",
        border: "#D9D3C7",
        // DepEd-themed palette used by the newer staff/teacher dashboard designs
        depedBlue: "#0033A0",
        depedBg: "#F9F9F9",
        textMain: "#1F2937",
        textMuted: "#4B5563",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
