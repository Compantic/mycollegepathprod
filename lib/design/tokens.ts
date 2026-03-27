// lib/design/tokens.ts
export const tokens = {
  colors: {
    primary: {
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
  radius: {
    card: "16px",
    button: "12px",
    pill: "999px",
  },
  shadow: {
    soft: "0px 10px 25px rgba(15, 23, 42, 0.08)",
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont",
  },
} as const;
