/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E7E7FD',
          200: '#D3D4FC',
          300: '#C9CBFB',
          400: '#8B8DF4',
          500: '#5B5FEF',
          600: '#4347C4',
          700: '#3A3DA8',
          800: '#2B2D7A',
        },
        accent: {
          DEFAULT: '#FF8B5E',
          light: '#FFE7DA',
        },
        ink: {
          DEFAULT: '#1E1B2E',
          secondary: '#6E6B84',
          faint: '#9C99AF',
        },
        surface: '#FFFFFF',
        'surface-alt': '#EDEBFA',
        canvas: '#F6F5FB',
        line: '#E4E1F5',
        success: '#33B27A',
        warning: '#F6C453',
        danger: '#FF5E6C',
        info: '#5B5FEF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(30,27,46,0.06)',
        md: '0 6px 20px rgba(30,27,46,0.08)',
        lg: '0 20px 60px rgba(30,27,46,0.18)',
      },
      borderRadius: {
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
};
