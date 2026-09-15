/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
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
        surface: {
          50: "#F8F9FC",
          100: "#F1F3F9",
          200: "#E5E8F0",
          400: "#9AA1B4",
          600: "#5B6172",
          800: "#1C2029",
          900: "#0E1116",
        },
        danger: {
          50: "#FDECF1",
          500: "#EF476F",
          600: "#D63458",
        },
        success: {
          50: "#E7F9F1",
          500: "#12B76A",
        },
      },
      borderRadius: {
        xl: "12px",
        xl2: "20px",
        xl3: "28px",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};