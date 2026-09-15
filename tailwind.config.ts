import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        noir: "#0A0A0A",
        obsidian: "#111111",
        gold: "#C9A227",
        amber: "#E7C86E"
      },
      boxShadow: {
        luxe: "0 0 0 1px rgba(201,162,39,0.25), 0 12px 40px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
};

export default config;
