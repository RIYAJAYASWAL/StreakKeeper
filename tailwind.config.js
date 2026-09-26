/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0F",     // page bg
        surface: "#15151E",        // card background
        surfaceBorder: "#232336",  // card border
        emberStart: "#FF6B6B",     // coral, gradient start
        emberMid: "#FF9F1C",       // orange-gold, gradient mid
        emberEnd: "#FFD23F",       // gold, gradient end
        violet: "#8B5CF6",         // secondary accent, links/focus states
        frozen: "#5EEAD4",         // icy cyan, frozen state
        muted: "#3F3F52",          // plum-gray, missed state
        textPrimary: "#F4F4F8",
        textSecondary: "#9494A8",
      },
      backgroundImage: {
        "ember-gradient": "linear-gradient(135deg, #FF6B6B 0%, #FF9F1C 50%, #FFD23F 100%)",
      },
    },
  },
  plugins: [],
};
