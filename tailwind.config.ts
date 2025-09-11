import type { Config } from 'tailwindcss'

const config = {
  theme: {
    fontSize: {
      'sm': '0.64rem',
      'tiny': '0.8rem',
      'base': '1rem',
      'lg': '1.25rem',
      'xl': '1.56rem',
      '2xl': '1.95rem',
      '3xl': '2.44rem',
      '4xl': '3.05rem',
      '5xl': '3.81rem',
      '6xl': '4.77rem',
      '7xl': '5.96rem',
    }
  },
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('tailwindcss-animate'),
  ],
} satisfies Config

export default config
