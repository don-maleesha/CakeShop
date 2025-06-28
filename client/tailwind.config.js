/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F5385D', // Blue-800
        secondary: '#FBBF24', // Yellow-400
        accent: '#EF4444', // Red-500
        background: '#F3F4F6', // Gray-200
        text: '#111827', // Gray-900
      },
    },
  },
  plugins: [],
}

