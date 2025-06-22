x/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '2000': '2000',
        '3000': '3000',
        '9999': '9999',
      }
    },
  },
  plugins: [],
}