/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#eef4fb",
          100: "#d6e4f3",
          200: "#adcbe7",
          300: "#78a9d4",
          400: "#4484be",
          500: "#2667a4",
          600: "#1e5288",
          700: "#1e3a5f",
          800: "#1b3250",
          900: "#182b44",
          950: "#0f1b2e",
        },
        accent: {
          DEFAULT: "#00d4aa",
          50: "#e6fbf6",
          100: "#b3f3e4",
          200: "#66e6c9",
          300: "#00d4aa",
          400: "#00b993",
          500: "#009e7d",
          600: "#008368",
        },
        warning: {
          DEFAULT: "#ff6b35",
          50: "#fff2ec",
          100: "#ffd9c4",
          200: "#ffb08a",
          300: "#ff874f",
          400: "#ff6b35",
          500: "#e5501a",
        },
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#070b14",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 170, 0.4)",
        "glow-sm": "0 0 10px rgba(0, 212, 170, 0.3)",
        card: "0 4px 24px -8px rgba(30, 58, 95, 0.15)",
        "card-hover": "0 8px 32px -8px rgba(30, 58, 95, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%, 100%": { transform: "translateY(0)", opacity: "1" },
          "50%": { transform: "translateY(100%)", opacity: "0.6" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
