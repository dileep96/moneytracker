import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        panel: "#121833",
        panel2: "#171f3d",
        muted: "#8892b0",
        text: "#e6edf7",
        accent: "#6ea8fe",
        good: "#3ddc97",
        warn: "#ffb86b",
        bad: "#ff6b6b",
        line: "#1f2a52",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
