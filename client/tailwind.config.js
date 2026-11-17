
/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        pentag: {
          darkest: "#022020",
          dark: "#003c3c",
          primary: "#007d69",
          accent: "#00a87e",
          light: "#00c896",
        },
      },
    },
  },
  plugins: [],
};

