/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F1F0FF",
          100: "#E5E3FF",
          500: "#6C63FF",
          600: "#5B52E8",
          700: "#4A42C7",
        },
        accent: {
          50: "#E6FFFB",
          100: "#CCFBF1",
          500: "#00C2A8",
          600: "#00A18C",
        },
        ink: {
          50: "#F8F9FC",
          100: "#F1F3F9",
          200: "#E5E8F0",
          400: "#9AA1B4",
          600: "#5B6172",
          800: "#1C2029",
          900: "#0E1116",
        },
        danger: { 50: "#FDECF1", 500: "#EF476F", 600: "#D63458" },
        success: { 50: "#E7F9F1", 500: "#12B76A" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(14, 17, 22, 0.18)",
        card: "0 6px 24px -10px rgba(14, 17, 22, 0.15)",
      },
      borderRadius: {
        xl2: "20px",
        xl3: "28px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};