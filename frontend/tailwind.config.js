/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      /* ── Dentzy Brand Colors (from tokens.css --dz-color-*) ──── */
      colors: {
        primary: {
          DEFAULT: 'var(--dz-color-primary, #708c80)',
          dark: 'var(--dz-color-primary-dark, #4a6a5a)',
          light: 'var(--dz-color-primary-light, #a3bfb1)',
          muted: 'var(--dz-color-primary-muted, rgba(112, 140, 128, 0.12))',
        },
        charcoal: 'var(--dz-color-charcoal, #1e2824)',
        dark: 'var(--dz-color-dark, #2a3d35)',
        surface: 'var(--dz-color-bg-surface, #ffffff)',
        'surface-alt': 'var(--dz-color-bg-surface-alt, #f8faf9)',
        page: 'var(--dz-color-bg-page, #f4f7f5)',
        border: 'var(--dz-color-border, #e2e8f0)',
        'border-light': 'var(--dz-color-border-light, #f0f2f1)',
        /* Semantic status colors */
        success: {
          DEFAULT: 'var(--dz-color-success, #22c55e)',
          bg: 'var(--dz-color-success-bg, #dcfce7)',
          text: 'var(--dz-color-success-text, #166534)',
        },
        warning: {
          DEFAULT: 'var(--dz-color-warning, #f59e0b)',
          bg: 'var(--dz-color-warning-bg, #fef3c7)',
          text: 'var(--dz-color-warning-text, #92400e)',
        },
        error: {
          DEFAULT: 'var(--dz-color-error, #ef4444)',
          bg: 'var(--dz-color-error-bg, #fee2e2)',
          text: 'var(--dz-color-error-text, #991b1b)',
        },
        info: {
          DEFAULT: 'var(--dz-color-info, #3b82f6)',
          bg: 'var(--dz-color-info-bg, #dbeafe)',
          text: 'var(--dz-color-info-text, #1e40af)',
        },
      },
      /* ── Typography ──────────────────────────────────────────── */
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--dz-font-family-mono, monospace)'],
      },
      /* ── Border Radius ───────────────────────────────────────── */
      borderRadius: {
        sm: 'var(--dz-radius-sm, 6px)',
        md: 'var(--dz-radius-md, 10px)',
        lg: 'var(--dz-radius-lg, 14px)',
        xl: 'var(--dz-radius-xl, 20px)',
        '2xl': 'var(--dz-radius-2xl, 28px)',
      },
      /* ── Box Shadow ──────────────────────────────────────────── */
      boxShadow: {
        xs: 'var(--dz-shadow-xs)',
        sm: 'var(--dz-shadow-sm)',
        md: 'var(--dz-shadow-md)',
        lg: 'var(--dz-shadow-lg)',
        xl: 'var(--dz-shadow-xl)',
        focus: 'var(--dz-shadow-focus)',
      },
      /* ── Animation Keyframes (for tailwindcss-animate + custom) */
      keyframes: {
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-rotate': {
          '0%': { '--glow-angle': '0deg' },
          '100%': { '--glow-angle': '360deg' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.75)' },
        },
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'glow-rotate': 'glow-rotate 3s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
