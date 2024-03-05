import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme.js'
import tailwindcssRadix from 'tailwindcss-radix'
import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

export default {
	content: ['./app/**/*.{ts,tsx,jsx,js}'],
	darkMode: 'class',
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '2rem',
			},
		},
		extend: {
			screens: {
				'2xl': '1400px',
			},
			colors: {
				border: 'hsl(var(--color-border))',
				input: {
					DEFAULT: 'hsl(var(--color-input))',
					invalid: 'hsl(var(--color-input-invalid))',
				},
				ring: {
					DEFAULT: 'hsl(var(--color-ring))',
					invalid: 'hsl(var(--color-foreground-danger))',
				},
				background: 'hsl(var(--color-background))',
				foreground: {
					DEFAULT: 'hsl(var(--color-foreground))',
					danger: 'hsl(var(--color-foreground-danger))',
				},
				brand: {
					primary: {
						DEFAULT: 'hsl(var(--color-brand-primary))',
						muted: 'hsl(var(--color-brand-primary-muted))',
					},
					secondary: {
						DEFAULT: 'hsl(var(--color-brand-secondary))',
						muted: 'hsl(var(--color-brand-secondary-muted))',
					},
					tertiary: 'hsl(var(--color-brand-tertiary))',
				},
				danger: 'hsl(var(--color-danger))',
				primary: {
					DEFAULT: 'hsl(var(--color-primary))',
					foreground: 'hsl(var(--color-primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--color-secondary))',
					foreground: 'hsl(var(--color-secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--color-destructive))',
					foreground: 'hsl(var(--color-destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--color-muted))',
					foreground: 'hsl(var(--color-muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--color-accent))',
					foreground: 'hsl(var(--color-accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--color-popover))',
					foreground: 'hsl(var(--color-popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--color-card))',
					foreground: 'hsl(var(--color-card-foreground))',
				},
				day: {
					100: 'hsl(var(--color-day-100))',
					200: 'hsl(var(--color-day-200))',
					300: 'hsl(var(--color-day-300))',
					400: 'hsl(var(--color-day-400))',
					500: 'hsl(var(--color-day-500))',
					600: 'hsl(var(--color-day-600))',
					700: 'hsl(var(--color-day-700))',
				},
				night: {
					100: 'hsl(var(--color-night-100))',
					200: 'hsl(var(--color-night-200))',
					300: 'hsl(var(--color-night-300))',
					400: 'hsl(var(--color-night-400))',
					500: 'hsl(var(--color-night-500))',
					600: 'hsl(var(--color-night-600))',
					700: 'hsl(var(--color-night-700))',
				},
			},
			borderRadius: {
				lg: `var(--radius)`,
				md: `calc(var(--radius) - 2px)`,
				sm: 'calc(var(--radius) - 4px)',
			},
			fontFamily: {
				sans: [
					'Nunito Sans',
					'Nunito Sans Fallback',
					...defaultTheme.fontFamily.sans,
				],
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
			fontSize: {
				// 1rem = 16px
				/** 80px size / 84px high / bold */
				mega: ['5rem', { lineHeight: '5.25rem', fontWeight: '700' }],
				/** 56px size / 62px high / bold */
				h1: ['3.5rem', { lineHeight: '3.875rem', fontWeight: '700' }],
				/** 40px size / 48px high / bold */
				h2: ['2.5rem', { lineHeight: '3rem', fontWeight: '700' }],
				/** 32px size / 36px high / bold */
				h3: ['2rem', { lineHeight: '2.25rem', fontWeight: '700' }],
				/** 28px size / 36px high / bold */
				h4: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '700' }],
				/** 24px size / 32px high / bold */
				h5: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
				/** 16px size / 20px high / bold */
				h6: ['1rem', { lineHeight: '1.25rem', fontWeight: '700' }],

				/** 32px size / 36px high / normal */
				'body-2xl': ['2rem', { lineHeight: '2.25rem' }],
				/** 28px size / 36px high / normal */
				'body-xl': ['1.75rem', { lineHeight: '2.25rem' }],
				/** 24px size / 32px high / normal */
				'body-lg': ['1.5rem', { lineHeight: '2rem' }],
				/** 20px size / 28px high / normal */
				'body-md': ['1.25rem', { lineHeight: '1.75rem' }],
				/** 16px size / 20px high / normal */
				'body-sm': ['1rem', { lineHeight: '1.25rem' }],
				/** 14px size / 18px high / normal */
				'body-xs': ['0.875rem', { lineHeight: '1.125rem' }],
				/** 12px size / 16px high / normal */
				'body-2xs': ['0.75rem', { lineHeight: '1rem' }],

				/** 18px size / 24px high / semibold */
				caption: ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
				/** 12px size / 16px high / bold */
				button: ['0.75rem', { lineHeight: '1rem', fontWeight: '700' }],
			},
		},
	},

	plugins: [tailwindcssRadix, tailwindcssAnimate, typography],
} satisfies Config
