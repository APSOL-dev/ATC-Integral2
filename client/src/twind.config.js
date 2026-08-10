import { defineConfig } from '@twind/core'
import presetAutoprefix from '@twind/preset-autoprefix'
import presetTailwind from '@twind/preset-tailwind'

export default defineConfig({
  presets: [presetAutoprefix(), presetTailwind()],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ATC Brand Colors
        brand: {
          blue: '#0f5da9',
          coral: '#fe4a65',
          dark: '#1e293b',
          light: '#f8fafc',
        },
        // Estado del pedido
        estado: {
          anulado:        '#dc2626',   // red-600
          pendiente:      '#d97706',   // amber-600
          aprobado:       '#2563eb',   // blue-600
          preparacion:    '#0891b2',   // cyan-600
          preparado:      '#059669',   // emerald-600
          cargado:        '#16a34a',   // green-600
          entregado:      '#15803d',   // green-700
          cerrado:        '#475569',   // gray-600
          parcial:        '#ea580c',   // orange-600
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      },
    },
  },
})
