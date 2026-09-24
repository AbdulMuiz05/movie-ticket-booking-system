/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f1',
          100: '#ffdfdf',
          200: '#ffc5c5',
          300: '#ff9d9d',
          400: '#ff6464',
          500: '#f53d3d',
          600: '#e01f1f',
          700: '#bc1515',
          800: '#9b1616',
          900: '#801919',
        },
        ink: {
          950: '#0a0a0f',
          900: '#101018',
          800: '#17171f',
          700: '#1f1f2a',
          600: '#2a2a37',
          500: '#3a3a4a',
          400: '#5a5a6b',
          300: '#8a8a99',
          200: '#b9b9c4',
          100: '#e6e6ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(245, 61, 61, 0.35)',
      },
    },
  },
  plugins: [],
};