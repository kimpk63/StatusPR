/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans Thai', 'system-ui', 'sans-serif'],
      },
      colors: {
        status: {
          online: '#22c55e',
          offline: '#ef4444',
          working: '#16a34a',
        },
      },
    },
  },
  plugins: [],
};
