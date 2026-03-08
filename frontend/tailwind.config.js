/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7cd',
          100: '#ffeec0',
          300: '#fdc3a1',
          500: '#fb9b8f',
          700: '#f57799',
          900: '#b24774',
        },
        accent: {
          100: '#fff3ef',
          500: '#fdc3a1',
          700: '#fb9b8f',
        },
      },
    },
  },
  plugins: [],
}
