/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Figma Design System Tokens from DESIGN.md
        canvas: '#ffffff',
        'inverse-canvas': '#000000',
        primary: '#000000',
        'on-primary': '#ffffff',
        ink: '#000000',
        'inverse-ink': '#ffffff',
        'surface-soft': '#F5F5F7',
        hairline: '#E5E5E5',
        'hairline-soft': '#F0F0F0',
        'accent-magenta': '#FF24BD',
        'semantic-success': '#10B981',
        // Signature Color Blocks
        block: {
          lime: '#D2F46E',
          lilac: '#E4D4F4',
          cream: '#FFF8EE',
          mint: '#B2F1DE',
          pink: '#FFCEE8',
          coral: '#FFC2A2',
          navy: '#16162C',
        },
        // Fallback brand mappings
        brand: {
          50: '#F5F5F7',
          100: '#E5E5E5',
          200: '#D4D4D8',
          500: '#000000',
          600: '#000000',
          700: '#000000',
          900: '#000000',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        'display-xl': '-1.72px',
        'display-lg': '-0.96px',
        'headline': '-0.26px',
        'subhead': '-0.26px',
        'body-sm': '-0.14px',
        'eyebrow': '0.54px',
        'caption': '0.60px',
      },
      borderRadius: {
        'xs': '2px',
        'sm': '6px',
        'md': '8px',
        'lg': '24px',
        'xl': '32px',
        'pill': '50px',
      },
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
        'section': '96px',
      }
    },
  },
  plugins: [],
}
