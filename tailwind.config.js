/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        q: {
          bg: "#0b0b14",
          card: "#111119",
          el: "#181824",
          input: "#0e0e18",
          brd: "#1e1e2e",
          tx: "#e8e8f0",
          txS: "#a0a0b8",
          txM: "#6b6b80",
          txD: "#3a3a4e",
          pr: "#8b5cf6",
          prH: "#a78bfa",
          prL: "#7c3aed",
          ac: "#c4b5fd",
          ok: "#34d399",
          dn: "#f87171",
          wn: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
    },
  },
  plugins: [],
};
