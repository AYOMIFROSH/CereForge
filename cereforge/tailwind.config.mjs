/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // More conservative lg breakpoint for better Edge compatibility
        'lg': '1000px',
        // Custom breakpoint specifically for dashboard grid
        'dashboard': '1200px',
      },
      colors: {

      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      zIndex: {
        '60': '60',
      }
    },
  },
  plugins: [],
};