/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': 'rgb(var(--bg-base) / <alpha-value>)',
        'surface': 'rgb(var(--bg-surface) / <alpha-value>)',
        'elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        'border-default': 'rgb(var(--border-default) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'accent': 'rgb(var(--accent-primary) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'accent-subtle': 'rgb(var(--accent-subtle) / <alpha-value>)',
        'success': 'rgb(var(--success) / <alpha-value>)',
        'error': 'rgb(var(--error) / <alpha-value>)',
        'warning': 'rgb(var(--warning) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      animation: {
        'fadeSlideUp': 'fadeSlideUp 300ms ease-out backwards',
        'pulseOp': 'pulseOp 1.2s infinite ease-in-out',
        'slideInFade': 'slideInFade 0.3s ease-out forwards',
        'pulse': 'pulse 1.5s infinite ease-in-out',
        'spin-fast': 'spin 600ms linear infinite',
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseOp: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        slideInFade: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
