/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'Comic Sans MS', 'cursive', 'sans-serif'],
      },
      colors: {
        'kid-blue': '#3b82f6',
        'kid-yellow': '#fbbf24',
        'kid-green': '#10b981',
        'kid-pink': '#ec4899',
        'kid-purple': '#8b5cf6',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}