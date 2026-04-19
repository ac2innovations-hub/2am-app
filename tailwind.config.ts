import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0D1628",
        navy: "#162236",
        peach: "#F8C8A8",
        coral: "#EE9B78",
        cream: "#FFFAF5",
        sage: "#A2C8A2",
        lavender: "#BEB2D7",
        gold: "#DAB478",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "peach-gradient":
          "linear-gradient(135deg, #F8C8A8 0%, #EE9B78 100%)",
        "peach-radial":
          "radial-gradient(circle at 50% 30%, rgba(248,200,168,0.18), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(248, 200, 168, 0.25)",
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "slide-up": "slideUp 280ms ease-out",
        "bounce-dot": "bounceDot 1.2s infinite ease-in-out",
        twinkle: "twinkle 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
