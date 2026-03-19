import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        cream: '#FDFAF5',
        warm: '#FAF7F0',
        parchment: '#F3EDE0',
        stone: { DEFAULT: '#E4DBD0', mid: '#C5B9AC', dark: '#9C8E82' },
        ink: { DEFAULT: '#1C1814', soft: '#3A342E', muted: '#7A6E66' },
        sage: { DEFAULT: '#4D6B44', light: '#EDF2EA', mid: '#8FAB8A' },
        blush: { DEFAULT: '#C4705A', light: '#F7EDE9' },
        dusty: { DEFAULT: '#B5748A', light: '#F3EAF0' },
        gold: { DEFAULT: '#A8883A', light: '#F5EDD8' },
      },
    },
  },
  plugins: [],
}
export default config
