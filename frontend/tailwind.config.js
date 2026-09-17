const plugin = require('tailwindcss/plugin');

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
      // Spring-like overshoot curves (no @angular/animations dependency -
      // plain CSS transitions/keyframes, matching this app's existing
      // preference for direct signals over framework indirection).
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(0.5rem) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(0.5rem) scale(0.95)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pop-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.85)' },
        },
        'pin-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(63, 164, 133, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(63, 164, 133, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out forwards',
        'fade-out': 'fade-out 200ms ease-in forwards',
        'slide-in-right': 'slide-in-right 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-out-right': 'slide-out-right 220ms ease-in forwards',
        'toast-in': 'toast-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'toast-out': 'toast-out 180ms ease-in forwards',
        'pop-in': 'pop-in 260ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pop-out': 'pop-out 150ms ease-in forwards',
        'pin-pulse': 'pin-pulse 2.2s ease-out infinite',
      },
    },
  },
  plugins: [
    // Guards `hover:` against touch devices so a tap doesn't leave a button
    // stuck in its hover state until the user taps elsewhere (Emil Kowalski
    // "sticky hover" fix) - applies to every existing hover: utility in the
    // app with no template changes required.
    plugin(({ addVariant }) => {
      addVariant('hover', '@media (hover: hover) { &:hover }');
    }),
  ],
};
