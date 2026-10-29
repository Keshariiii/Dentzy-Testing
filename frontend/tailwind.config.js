/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      /* ── Dentzy Brand Colors (from tokens.css & design specification) ──── */
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        ring: 'var(--ring)',
        input: 'var(--input)',
        primary: {
          DEFAULT: 'var(--primary, #7c9082)',
          foreground: 'var(--primary-foreground, #ffffff)',
          dark: 'var(--dz-color-primary-dark, #5a6b5e)',
          light: 'var(--dz-color-primary-light, #bfc9bb)',
          muted: 'var(--dz-color-primary-muted, rgba(124, 144, 130, 0.16))',
        },
        secondary: {
          DEFAULT: 'var(--secondary, #ced4bf)',
          foreground: 'var(--secondary-foreground, #1a1f2e)',
        },
        destructive: {
          DEFAULT: 'var(--destructive, #c73e3a)',
          foreground: 'var(--destructive-foreground, #ffffff)',
        },
        charcoal: 'var(--dz-color-charcoal, #1a1f2e)',
        dark: 'var(--dz-color-dark, #1a1f2e)',
        surface: 'var(--dz-color-bg-surface, #ffffff)',
        'surface-alt': 'var(--dz-color-bg-surface-alt, #e8e6e1)',
        page: 'var(--dz-color-bg-page, #f8f7f4)',
        border: 'var(--border, #e8e6e1)',
        'border-light': 'var(--border, #e8e6e1)',
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
          DEFAULT: 'var(--dz-color-error, #c73e3a)',
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
