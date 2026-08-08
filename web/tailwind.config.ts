import type { Config } from 'tailwindcss'

/**
 * Palette: deep navy (institutional authority) + maroon (the trust's heritage
 * colour) + gold (accent, used sparingly for emphasis and achievement).
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/content/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eef4fc',
          100: '#d5e4f7',
          200: '#a9c7ef',
          300: '#7aa7e4',
          400: '#4a83d4',
          500: '#2a63b8',
          600: '#1c4b93',
          700: '#153a73',
          800: '#0f2b56',
          900: '#0b2039',
          950: '#061424',
        },
        maroon: {
          DEFAULT: 'hsl(var(--maroon))',
          foreground: 'hsl(var(--maroon-foreground))',
          50: '#fdf2f5',
          100: '#fbe4ea',
          200: '#f6c9d5',
          300: '#eb9db2',
          400: '#dc6689',
          500: '#c73d65',
          600: '#a82a4f',
          700: '#8a1f40',
          800: '#6b1230',
          900: '#520d25',
          950: '#320616',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          foreground: 'hsl(var(--gold-foreground))',
          50: '#fdf9ec',
          100: '#faf0cc',
          200: '#f4de95',
          300: '#ecc757',
          400: '#e3b02e',
          500: '#c9a227',
          600: '#a8801d',
          700: '#855f1a',
          800: '#6e4c1c',
          900: '#5e401d',
          950: '#36210c',
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
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(11, 32, 57, 0.18)',
        card: '0 1px 2px rgba(11,32,57,.04), 0 8px 24px -12px rgba(11,32,57,.18)',
        lift: '0 12px 40px -12px rgba(11,32,57,.35)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(42,99,184,.35), transparent 60%)',
        'gold-sheen':
          'linear-gradient(100deg, transparent 30%, rgba(233,196,106,.45) 50%, transparent 70%)',
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
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
