/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
    colors: {
      primary: "#05CD99",
      danger: "#D32F2F",
    },
    animation: {
      popIn: "popIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
    },
    keyframes: {
      popIn: {
        "0%": { opacity: "0", transform: "scale(0.85) translateY(10px)" },
        "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
      },
    },
  },
},

    extend: {},
  }
