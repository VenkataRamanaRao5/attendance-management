module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f5f5f5',
          100: '#3c3c3c',
          200: '#2e2e2e',
          300: '#1e1e1e'
        },
        status: {
          present: '#16a34a',
          absent: '#ef4444'
        }
      }
    }
  },
  plugins: []
}
