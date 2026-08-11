/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E0F5F2',
          200: '#B8EBE3',
          300: '#A5E5DD',
          400: '#99E1D9',
          500: '#6BC9BE',
          600: '#4AAFA5',
          700: '#2E8C83',
          800: '#0F4C45',
        },
        accent: {
          DEFAULT: '#0F4C45',
          light: '#B8EBE3',
        },
        ink: {
          DEFAULT: '#1A2B2A',
          secondary: '#5B6B68',
          faint: '#8FA39F',
        },
        surface: '#FFFFFF',
        'surface-alt': '#F0F5F3',
        canvas: '#F7FAF9',
        line: '#E2E8E6',
        success: '#1F9D6B',
        warning: '#B45309',
        danger: '#DC2626',
        info: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,43,42,0.06)',
        md: '0 6px 20px rgba(26,43,42,0.08)',
        lg: '0 20px 60px rgba(26,43,42,0.18)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
