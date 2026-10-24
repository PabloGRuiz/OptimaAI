/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Epic Games Carbon Surfaces
        surface: {
          bg: '#0e0e10',
          panel: '#121214',
          card: '#18181c',
          hover: '#202026',
          subtle: '#1f1f24',
          input: '#151518',
        },
        // Steam Modern UI Lines & Dividers
        line: {
          subtle: '#26262b',
          divider: '#2d2d34',
          strong: '#3b3b45',
        },
        // Steam Modern UI Neutral Typography
        ink: {
          primary: '#f3f4f6',
          secondary: '#9ca3af',
          muted: '#6b7280',
          badge: '#d1d5db',
        },
        // Xbox Core Green & Razer Gaming Accents
        xbox: {
          dark: '#0c5c30',
          base: '#107C41',
          hover: '#108d4a',
          active: '#0e6d39',
          bright: '#13de64',
          glow: '#10d05c',
        },
        // Telemetry & Alerts
        metric: {
          good: '#10d05c',
          warn: '#f59e0b',
          crit: '#ef4444',
          silver: '#d1d5db',
        }
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        badge: '6px',
      },
      boxShadow: {
        'xbox-glow': '0 0 16px -2px rgba(16, 208, 92, 0.35)',
        'xbox-glow-sm': '0 0 8px 0px rgba(16, 208, 92, 0.25)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.75)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
