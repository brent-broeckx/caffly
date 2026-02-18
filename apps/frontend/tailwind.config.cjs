/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0f0b09",
          canvas: "#17110e",
          panel: "#211712",
          panelSoft: "#1a130f",
          border: "#4a2d1a",
          borderStrong: "#7a4a27",
          muted: "#d6b8a0",
          text: "#f9ebde"
        },
        accent: {
          blue: "#f59e0b",
          violet: "#fb923c",
          success: "#68d391",
          warning: "#fbbf24",
          danger: "#f87171"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(251, 146, 60, 0.45), 0 0 28px rgba(245, 158, 11, 0.28)",
        panel: "0 20px 45px rgba(0, 0, 0, 0.45)",
        inset: "inset 0 0 0 1px rgba(251, 146, 60, 0.16)"
      },
      backgroundImage: {
        "futuristic-glow": "radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.22), transparent 35%), radial-gradient(circle at 80% 12%, rgba(251, 146, 60, 0.18), transparent 28%), radial-gradient(circle at 45% 80%, rgba(180, 83, 9, 0.14), transparent 32%)"
      }
    }
  },
  plugins: []
};
