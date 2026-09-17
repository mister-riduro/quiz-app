/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        fredoka: ['Fredoka', 'Nunito', 'sans-serif'],
      },
      colors: {
        duo: {
          green: {
            DEFAULT: '#58CC02',
            border: '#46A302',
            light: '#D7FFB8',
          },
          blue: {
            DEFAULT: '#1CB0F6',
            border: '#1899D6',
            light: '#DDF4FF',
          },
          orange: {
            DEFAULT: '#FF9600',
            border: '#D97F00',
            light: '#FFE8CC',
          },
          red: {
            DEFAULT: '#FF4B4B',
            border: '#EA2B2B',
            light: '#FFDFE0',
          },
          yellow: {
            DEFAULT: '#FFC800',
            border: '#D4A500',
            light: '#FFF5CC',
          },
          gray: {
            DEFAULT: '#E5E5E5',
            border: '#CECECE',
            light: '#F7F7F7',
          },
          dark: '#4B4B4B',
          bg: '#F7F9FA',
        },
      },
      boxShadow: {
        'duo-sm': '0 2px 0 0 rgba(0, 0, 0, 0.1)',
        'duo-md': '0 4px 0 0 rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

