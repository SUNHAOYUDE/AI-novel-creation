/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        mist: "#d6deea",
        accent: "#4ad0bf",
        ember: "#e6a657",
        panel: "#101b2d"
      },
      boxShadow: {
        panel: "0 24px 60px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};
