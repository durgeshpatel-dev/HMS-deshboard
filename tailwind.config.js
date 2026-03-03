/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ff6a00",
        "primary-content": "#ffffff",
        "primary-light": "#fff0e5",
        "primary-dark": "#cc5500",
        "background-light": "#f8f7f5",
        "background-dark": "#23170f",
        "surface-light": "#ffffff",
        "surface-dark": "#2d241e",
        "text-main": "#181410",
        "text-secondary": "#8d715e",
        "border-light": "#e6e2de",
        "border-color": "#e7dfda",
        "status-preparing": "#FF6B00",
        "status-ready": "#22C55E",
        secondary: "#3b82f6",
        "secondary-light": "#eff6ff",
        success: "#22c55e",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
