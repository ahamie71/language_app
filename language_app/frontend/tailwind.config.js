/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        duo: {
          green:       '#58CC02',
          'green-d':   '#58A700',
          'green-bg':  '#D7FFB8',
          yellow:      '#FFD900',
          'yellow-d':  '#CCA800',
          'yellow-bg': '#FFF9E0',
          blue:        '#1CB0F6',
          'blue-d':    '#0099D6',
          'blue-bg':   '#DDF4FF',
          red:         '#FF4B4B',
          'red-d':     '#EA2929',
          'red-bg':    '#FFDFE0',
          purple:      '#CE82FF',
          'purple-d':  '#A560D8',
          'purple-bg': '#F4E0FF',
          orange:      '#FF9600',
          gray:        '#F7F7F7',
          border:      '#E5E5E5',
          text:        '#3C3C3C',
          muted:       '#777777',
        },
      },
      borderRadius: { duo: '16px', 'duo-sm': '12px', 'duo-lg': '24px' },
      fontFamily:   { duo: ['"Nunito"', 'system-ui', 'sans-serif'] },
      keyframes: {
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%':     { transform: 'translateX(-8px)' },
          '40%':     { transform: 'translateX(8px)' },
          '60%':     { transform: 'translateX(-6px)' },
          '80%':     { transform: 'translateX(6px)' },
        },
        'bounce-in': {
          '0%':   { transform: 'scale(0.92)', opacity: '0' },
          '60%':  { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
      animation: {
        shake:       'shake 0.5s ease',
        'bounce-in': 'bounce-in 0.4s ease',
      },
    },
  },
  plugins: [],
}
