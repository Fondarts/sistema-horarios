/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Colores de fondo (Color Principal)
        bg: {
          primary: 'var(--color-bg-primary, #F9FAFB)',
          'primary-light': 'var(--color-bg-primary-light, #FFFFFF)',
          'primary-lighter': 'var(--color-bg-primary-lighter, #FFFFFF)',
          'primary-dark': 'var(--color-bg-primary-dark, #F3F4F6)',
        },
        // Colores de texto (Color Secundario)
        text: {
          primary: 'var(--color-text-primary, #1F2937)',
          secondary: 'var(--color-text-secondary, #4B5563)',
          muted: 'var(--color-text-muted, #6B7280)',
        },
        // Color de acento (hover, selecciones)
        accent: {
          DEFAULT: 'var(--color-accent, #3B82F6)',
          hover: 'var(--color-accent-hover, #2563EB)',
          active: 'var(--color-accent-active, #1D4ED8)',
        },
        // Mantener compatibilidad con primary/secondary para botones
        primary: {
          50: 'var(--color-primary-50, #eff6ff)',
          100: 'var(--color-primary-100, #dbeafe)',
          500: 'var(--color-primary-500, #3b82f6)',
          600: 'var(--color-primary-600, #2563eb)',
          700: 'var(--color-primary-700, #1d4ed8)',
        },
        secondary: {
          50: 'var(--color-secondary-50, #f8fafc)',
          100: 'var(--color-secondary-100, #f1f5f9)',
          500: 'var(--color-secondary-500, #64748b)',
          600: 'var(--color-secondary-600, #475569)',
        },
        // Sobrescribir gray para usar las variables personalizadas
        gray: {
          50: 'var(--color-bg-primary-light, #F9FAFB)',
          100: 'var(--color-bg-primary, #F3F4F6)',
          200: 'var(--color-bg-primary-dark, #E5E7EB)',
          300: 'var(--color-bg-primary-dark, #D1D5DB)',
          400: 'var(--color-text-muted, #9CA3AF)',
          500: 'var(--color-text-muted, #6B7280)',
          600: 'var(--color-text-secondary, #4B5563)',
          700: 'var(--color-bg-primary-dark, #374151)',
          800: 'var(--color-bg-primary-dark, #1F2937)',
          900: 'var(--color-bg-primary-dark, #111827)',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}


