/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#DBF3EF',
          200: '#B8EBE3',
          300: '#A5E5DD',
          400: '#99E1D9',
          500: '#6CC9BE',
          600: '#4AAFA5',
          700: '#2E8C83',
          800: '#0F4C45',
        },
        ink: {
          DEFAULT: '#1A2B2A',
          secondary: '#5B6B68',
        },
        surface: '#FFFFFF',
        canvas: '#F7FAF9',
        line: '#E2E8E6',
        success: '#1F9D6B',
        warning: '#B45309',
        danger: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
