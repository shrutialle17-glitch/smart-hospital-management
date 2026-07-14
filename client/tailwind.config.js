/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "rgba(var(--color-primary), <alpha-value>)",
        secondary: "rgba(var(--color-secondary), <alpha-value>)",
        accent: "rgba(var(--color-accent), <alpha-value>)",
        background: "rgba(var(--color-background), <alpha-value>)",
        surface: "rgba(var(--color-surface), <alpha-value>)",
        'text-primary': "rgba(var(--color-text-primary), <alpha-value>)",
        'text-secondary': "rgba(var(--color-text-secondary), <alpha-value>)",
        'text-muted': "rgba(var(--color-text-muted), <alpha-value>)",
        'border-light': "rgba(var(--color-border-light), <alpha-value>)",
        'border-default': "rgba(var(--color-border-default), <alpha-value>)",
        success: "rgba(var(--color-success), <alpha-value>)",
        warning: "rgba(var(--color-warning), <alpha-value>)",
        error: "rgba(var(--color-error), <alpha-value>)",
        info: "rgba(var(--color-info), <alpha-value>)",
        gray: {
          50: "rgba(var(--color-gray-50), <alpha-value>)",
          100: "rgba(var(--color-gray-100), <alpha-value>)",
          200: "rgba(var(--color-gray-200), <alpha-value>)",
          300: "rgba(var(--color-gray-300), <alpha-value>)",
          400: "rgba(var(--color-gray-400), <alpha-value>)",
          500: "rgba(var(--color-gray-500), <alpha-value>)",
          600: "rgba(var(--color-gray-600), <alpha-value>)",
          700: "rgba(var(--color-gray-700), <alpha-value>)",
          800: "rgba(var(--color-gray-800), <alpha-value>)",
          900: "rgba(var(--color-gray-900), <alpha-value>)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
