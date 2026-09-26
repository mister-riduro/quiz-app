/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Nunito",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        fredoka: ["Fredoka", "Nunito", "sans-serif"],
      },
      spacing: {
        13: "3.25rem",
        15: "3.75rem",
      },
      colors: {
        duo: {
          green: {
            DEFAULT: "#58CC02",
            border: "#46A302",
            light: "#D7FFB8",
          },
          blue: {
            DEFAULT: "#1CB0F6",
            border: "#1899D6",
            light: "#DDF4FF",
          },
          orange: {
            DEFAULT: "#FF9600",
            border: "#D97F00",
            light: "#FFE8CC",
          },
          red: {
            DEFAULT: "#FF4B4B",
            border: "#EA2B2B",
            light: "#FFDFE0",
          },
          yellow: {
            DEFAULT: "#FFC800",
            border: "#D4A500",
            light: "#FFF5CC",
          },
          gray: {
            DEFAULT: "#E5E5E5",
            border: "#CECECE",
            light: "#F7F7F7",
          },
          dark: "#0F172A",
          bg: "#F7F9FA",
        },
      },
      boxShadow: {
        "duo-sm": "0 2px 0 0 rgba(0, 0, 0, 0.1)",
        "duo-md": "0 4px 0 0 rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        "air-sm": "8px",
        "air-md": "12px",
        "air-lg": "14px",
        "air-xl": "16px",
        "2xl": "1rem", // 16px
        "3xl": "1rem", // 16px - capped from 24px for proportional elegance
      },
    },
  },
  plugins: [],
};
