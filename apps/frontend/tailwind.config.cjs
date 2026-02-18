/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#070b1a",
          canvas: "#0a1025",
          panel: "#101937",
          panelSoft: "#0e1632",
          border: "#2a3761",
          borderStrong: "#4d5e9b",
          muted: "#a9b8df",
          text: "#e5ebff"
        },
        accent: {
          blue: "#66a3ff",
          violet: "#8a7dff",
          success: "#68d391",
          warning: "#f6c66d",
          danger: "#f07178"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(120, 150, 255, 0.35), 0 0 28px rgba(87, 126, 255, 0.28)",
        panel: "0 20px 45px rgba(0, 0, 0, 0.45)",
        inset: "inset 0 0 0 1px rgba(148, 172, 255, 0.14)"
      },
      backgroundImage: {
        "futuristic-glow": "radial-gradient(circle at 20% 20%, rgba(90, 126, 255, 0.2), transparent 35%), radial-gradient(circle at 80% 12%, rgba(155, 114, 255, 0.14), transparent 28%), radial-gradient(circle at 45% 80%, rgba(69, 109, 255, 0.12), transparent 32%)"
      }
    }
  },
  plugins: []
};
