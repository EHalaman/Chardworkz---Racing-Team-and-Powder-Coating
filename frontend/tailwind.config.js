/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Poppins',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        'nav-bg': '#F5F5F5',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#3FA485',
          hover: '#358C71',
          light: '#E7F4F0',
        },
        secondary: {
          DEFAULT: '#E2B24A',
          hover: '#C99B3A',
          light: '#FBF1DE',
        },
        danger: {
          DEFAULT: '#E87351',
          hover: '#D65F3D',
          light: '#FCE8E2',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
