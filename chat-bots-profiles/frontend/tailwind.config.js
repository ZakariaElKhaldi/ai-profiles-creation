/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // You can customize colors here if needed
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#f1f5f9',
            a: {
              color: '#60a5fa',
              '&:hover': {
                color: '#93c5fd',
              },
            },
            h1: {
              color: '#f1f5f9',
            },
            h2: {
              color: '#f1f5f9',
            },
            h3: {
              color: '#f1f5f9',
            },
            h4: {
              color: '#f1f5f9',
            },
            strong: {
              color: '#f1f5f9',
            },
            code: {
              color: '#e2e8f0',
              backgroundColor: '#1e293b',
              borderRadius: '0.25rem',
              padding: '0.2em 0.4em',
            },
            pre: {
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              borderRadius: '0.375rem',
              border: '1px solid #1e293b',
            },
          },
        },
      },
    },
  },
  plugins: [
    // Enable typography plugin for rich text formatting
    require('@tailwindcss/forms'),
  ],
} 