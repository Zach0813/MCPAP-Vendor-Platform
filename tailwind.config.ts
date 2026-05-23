import type { Config } from 'tailwindcss';

/**
 * Magic City Plant-A-Palooza — Tailwind config
 *
 * Placeholder plant-themed palette. Swap these hex values when final branding lands.
 * All accent/ink combos below have been picked to meet WCAG AA on white backgrounds
 * (contrast >= 4.5:1 for body text, >= 3:1 for large text/UI components).
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — deep sage green. AA on white at 16px.
        sage: {
          50: '#f3f7f3',
          100: '#e3ede3',
          200: '#c7dbc8',
          300: '#9fc1a2',
          400: '#71a276',
          500: '#4f8856',
          600: '#3c6c43',
          700: '#315637',
          800: '#29452e',
          900: '#233a28',
          950: '#0f1f13',
        },
        // Warm accent — clay/terracotta. Use sparingly for CTAs.
        terracotta: {
          50: '#fbf5f1',
          100: '#f5e7dc',
          200: '#eaccb6',
          300: '#dcaa87',
          400: '#cc8359',
          500: '#bf6839',
          600: '#a8512d',
          700: '#883e26',
          800: '#6f3424',
          900: '#5b2c1f',
          950: '#31150e',
        },
        // Soft neutral background.
        cream: {
          50: '#fdfcf7',
          100: '#f9f5e7',
          200: '#f1ead0',
          300: '#e5d8a9',
          400: '#d6c07e',
          500: '#c5a35a',
        },
        // Semantic UI colors mapped to brand.
        ink: '#1a1f1a',       // body text
        muted: '#5a625a',     // secondary text (AA at 16px on white)
        border: '#e3ede3',    // hairline dividers
        surface: '#fdfcf7',   // page background
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
        display: ['Georgia', '"Times New Roman"', 'serif'],
      },
      minHeight: {
        'touch': '44px', // WCAG 2.5.5 minimum touch target
      },
      minWidth: {
        'touch': '44px',
      },
      spacing: {
        'touch': '44px',
      },
      maxWidth: {
        'prose-narrow': '60ch',
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(15,31,19,0.04), 0 4px 12px rgba(15,31,19,0.06)',
        'panel': '0 -4px 24px rgba(15,31,19,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 240ms cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
