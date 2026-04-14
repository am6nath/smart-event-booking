/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forest Green Palette
        forest: {
          950: '#0D1F0A',
          900: '#1A2E17',
          800: '#243D1F',
          700: '#2D5A27',
          600: '#3D7134',
          500: '#4E8F43',
          400: '#6BAB61',
          300: '#8DC483',
          200: '#B5D4AF',
          100: '#D8EBD5',
          50:  '#EDF5EB',
        },
        // Paper / Cream Palette
        paper: {
          900: '#2C2717',
          700: '#6B6244',
          500: '#A09170',
          300: '#D4CBAF',
          200: '#E8E0C8',
          100: '#F2EDD8',
          50:  '#F8F5EC',
          DEFAULT: '#FAF7F0',
        },
        // Ink colors for text
        ink: {
          900: '#1A1A12',
          700: '#3A3A28',
          500: '#6B6B52',
          300: '#A3A38A',
          100: '#D4D4BC',
        },
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
        'gradient-paper': 'linear-gradient(135deg, #FAF7F0 0%, #F2EDD8 50%, #EBE4CC 100%)',
      },
      fontFamily: {
        serif: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"DM Mono"', 'monospace'],
      },
      animation: {
        'fadeIn':    'fadeIn 0.5s ease-out forwards',
        'slideUp':   'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'leafFall':  'leafFall 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        leafFall: {
          '0%':   { opacity: '0', transform: 'translateY(-8px) rotate(-3deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
        }
      },
      boxShadow: {
        'paper':    '4px 4px 0px rgba(45,90,39,0.12)',
        'paper-lg': '6px 6px 0px rgba(45,90,39,0.15)',
        'stamp':    'inset 0 0 0 2px rgba(45,90,39,0.3)',
      },
      borderRadius: {
        'none': '0',
        'sm':   '2px',
        DEFAULT: '4px',
        'md':   '6px',
      }
    },
  },
  plugins: [],
}