/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rammis-blue': '#1a3b70',
        'rammis-teal': '#00a884',
      }
    },
  },
  plugins: [],
}