import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0A2643",
        navy2: "#123A63",
        amber: "#FCA311",
        brandbg: "#F2F4F7",
        ok: "#15803D",
        okbg: "#DCFCE7",
        danger: "#B91C1C",
        dangerbg: "#FEE2E2",
        info: "#0369A1",
        infobg: "#E0F2FE",
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
