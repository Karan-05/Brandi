import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 60px rgba(28, 32, 24, 0.12)",
      },
      colors: {
        canvas: "#f7f3eb",
        ink: "#1d241c",
        accent: "#215446",
        warm: "#f2c66d",
        mist: "#ebefe8",
        blush: "#f6e5d5",
      },
    },
  },
  plugins: [],
};

export default config;
