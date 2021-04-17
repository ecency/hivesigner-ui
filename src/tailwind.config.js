const theme = require('tailwindcss/defaultTheme')

module.exports = {
  purge: [
    './**/*.vue'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    ...theme,
    extend: {
      colors: {
        gray: {
          DEFAULT: "#828282",
          '600': '#676767',
          '500': '#b5bbc3',
          '400': "#C4C4C4",
          '300': '#e9e7e7'
        },
        primary: {
          DEFAULT: "#E31337",
          dark: "#CD1434"
        },
        black: {
          '400': '#4F4F4F',
          '500': '#414141'
        }
      },
      container: {
        screens: {
          sm: "100%",
          md: "600px",
          xl: "1280px"
        }
      },
      fontFamily: {
        old: ['Circular-Pro', 'Helvetica', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
