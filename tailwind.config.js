/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'teal-light': '#80CBC4',
        'teal-lighter': '#B4EBE6', 
        'cream': '#FBF8EF',
        'orange': '#FFB433'
      }
    },
  },
  plugins: [],
}

