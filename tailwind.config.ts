import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Inter Variable", ...fontFamily.sans],
      },
      colors: {
        // Design system tokens
        primary: {
          DEFAULT: "#0055FF",
          50: "#EBF0FF",
          100: "#D6E1FF",
          200: "#ADC4FF",
          300: "#7AA2FF",
          400: "#3D74FF",
          500: "#0055FF",
          600: "#0044CC",
          700: "#003399",
          800: "#002266",
          900: "#001133",
        },
        sidebar: {
          bg: "#FFFFFF",
          hover: "#F3F4F6",
          active: "#111827",
          text: "#9CA3AF",
          "text-active": "#111827",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F9FAFB",
          subtle: "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          subtle: "#F3F4F6",
        },
        // Provider colors
        google: {
          DEFAULT: "#4285F4",
          light: "#EBF3FE",
        },
        microsoft: {
          DEFAULT: "#00A4EF",
          light: "#E6F6FE",
        },
        apple: {
          DEFAULT: "#555555",
          light: "#F5F5F7",
        },
        fastmail: {
          DEFAULT: "#1E7BE0",
          light: "#E8F2FD",
        },
        yahoo: {
          DEFAULT: "#7B0099",
          light: "#F5E6FF",
        },
        nextcloud: {
          DEFAULT: "#0082C9",
          light: "#E6F3FB",
        },
        zoho: {
          DEFAULT: "#3E5BFC",
          light: "#EDF0FF",
        },
        proton: {
          DEFAULT: "#6D4AFF",
          light: "#F0ECFF",
        },
        caldav: {
          DEFAULT: "#6B7280",
          light: "#F3F4F6",
        },
        // Status colors
        conflict: {
          hard: "#DC2626",
          soft: "#D97706",
          "hard-bg": "#FEF2F2",
          "soft-bg": "#FFFBEB",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      keyframes: {
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-in": "fade-in 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slide-up 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
