/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {colors: {
      azulUnibra: {
        300: '#192a56'
      },
    }},
  },
  plugins: [],
};
