const theme = require('tailwindcss/defaultTheme')

module.exports = {
  purge: [
    './**/*.vue',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    ...theme,
    extend: {
      colors: {
        gray: {
          DEFAULT: '#828282',
          '600': '#676767',
          '550': '#BDBDBD',
          '500': '#b5bbc3',
          '400': '#C4C4C4',
          '300': '#e9e7e7'
        },
        primary: {
          DEFAULT: '#E31337',
          dark: '#CD1434',
          '200': '#F4A1AF',
          '100': '#FCE3E7',
        },
        black: {
          DEFAULT: '#000000',
          '400': '#4F4F4F',
          '500': '#414141',
        },
        success: {
          '200': '#dcffe4',
          '500': '#165c26',
        },
        warning: {
          '200': '#fffbdd',
          '500': '#735c0f',
        },
        error: {
          '200': '#ffdce0',
          '500': '#86181d',
        },
      },
      container: {
        screens: {
          sm: '100%',
          md: '600px',
          xl: '1280px',
        },
      },
      fontFamily: {
        old: ['Circular-Pro', 'Helvetica', 'Arial', 'sans-serif'],
      },
      outline: {
        disabled: 'none',
      },
      zIndex: {
        '-1': '-1',
      }
    },
  },
  plugins: [],
}
