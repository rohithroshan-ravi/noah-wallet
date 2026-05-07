/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#c8ff00',
        dark: '#0d0d0d',
        card: '#1c1c1c',
      },
    },
  },
  plugins: [],
};
