import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        brand: ['var(--font-brand)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Type scale: xs lifts to 13px so metadata stops reading as fine print;
      // base is 15px; sizes above 2xl grow slower than Tailwind's default and
      // carry a little negative tracking (Familjen is already compact, so it
      // stays light) — headings don't need extra tracking classes.
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.125rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.1875rem', { lineHeight: '1.625rem', letterSpacing: '-0.005em' }],
        '2xl': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.6875rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '4xl': ['2.125rem', { lineHeight: '2.375rem', letterSpacing: '-0.015em' }],
        '5xl': ['2.625rem', { lineHeight: '2.875rem', letterSpacing: '-0.015em' }],
        '6xl': ['3.25rem', { lineHeight: '3.375rem', letterSpacing: '-0.02em' }],
        '7xl': ['3.875rem', { lineHeight: '3.875rem', letterSpacing: '-0.02em' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        eco: {
          blue: 'hsl(var(--eco-blue) / <alpha-value>)',
          violet: 'hsl(var(--eco-violet) / <alpha-value>)',
          orange: 'hsl(var(--eco-orange) / <alpha-value>)',
          teal: 'hsl(var(--eco-teal) / <alpha-value>)',
          pink: 'hsl(var(--eco-pink) / <alpha-value>)',
          amber: 'hsl(var(--eco-amber) / <alpha-value>)',
          green: 'hsl(var(--eco-green) / <alpha-value>)',
        },
        'card-hover': 'hsl(var(--card-hover))',
        'border-strong': 'hsl(var(--border-strong))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
