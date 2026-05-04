import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          700: "#173AA8",
          600: "#1F4DB8",
          500: "#2B5FD9",
          400: "#3F76E8",
        },
        secondary: {
          100: "#EEF3FF",
          200: "#E2E9F8",
          300: "#D6E0F0",
        },
        bg: {
          main: "#F7F9FC",
          card: "#FFFFFF",
          border: "#E5EAF2",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
        status: {
          successBg: "#ECFDF5",
          successText: "#16A34A",
          dangerBg: "#FEF2F2",
          dangerText: "#DC2626",
          warningBg: "#FFF7ED",
          warningText: "#EA580C",
          infoBg: "#EFF6FF",
          infoText: "#2563EB",
        },
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0px 10px 25px rgba(15, 23, 42, 0.08)",
        glow: "0 0 40px rgba(43, 95, 217, 0.08)",
        "glow-lg": "0 0 60px rgba(43, 95, 217, 0.12)",
        "onboarding-card":
          "0 25px 50px -12px rgba(15, 27, 45, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset, 0 0 40px rgba(43, 95, 217, 0.06)",
        "onboarding-card-hover":
          "0 32px 64px -12px rgba(15, 27, 45, 0.16), 0 0 0 1px rgba(43, 95, 217, 0.12), 0 0 48px rgba(43, 95, 217, 0.1)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      fontSize: {
        "hero": ["3rem", { lineHeight: "1.15", fontWeight: "800" }],
        "section": ["2rem", { lineHeight: "1.25", fontWeight: "700" }],
        "card-title": ["1.125rem", { lineHeight: "1.35", fontWeight: "600" }],
        "body": ["0.9375rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-medium": ["0.9375rem", { lineHeight: "1.5", fontWeight: "500" }],
        "helper": ["0.8125rem", { lineHeight: "1.4", fontWeight: "400" }],
      },
      fontWeight: {
        "extrabold": "800",
      },
      keyframes: {
        "onboarding-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "onboarding-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px rgba(43, 95, 217, 0.25)" },
          "50%": { opacity: "0.9", boxShadow: "0 0 32px rgba(43, 95, 217, 0.35)" },
        },
        "onboarding-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "onboarding-progress-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--progress-width, 0%)" },
        },
        "onboarding-shine": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "onboarding-pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "onboarding-aurora": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.5" },
          "50%": { transform: "translate(4%, -3%) scale(1.05)", opacity: "0.65" },
        },
        "onboarding-shimmer-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "onboarding-float": "onboarding-float 3s ease-in-out infinite",
        "onboarding-glow": "onboarding-glow 2s ease-in-out infinite",
        "onboarding-scale-in": "onboarding-scale-in 0.4s ease-out forwards",
        "onboarding-shine": "onboarding-shine 3s ease-in-out infinite",
        "onboarding-pulse-soft": "onboarding-pulse-soft 2s ease-in-out infinite",
        "onboarding-aurora": "onboarding-aurora 14s ease-in-out infinite",
        "onboarding-shimmer-line": "onboarding-shimmer-line 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
