/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14181f',
        panel: '#ffffff',
        base: '#eef1ee',
        brand: {
          DEFAULT: '#0f5c52',
          dark: '#0a3f38',
        },
        hazard: '#d9720f',
        critical: '#a8371c',
        success: '#2f7d4f',
        line: '#d7ddd4',
        muted: '#6b7570',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tag: '0.06em',
      },
    },
  },
  plugins: [],
};
