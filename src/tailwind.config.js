module.exports = {
  // purge: [
  //   '**/*.vue'
  // ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        gray: {
          DEFAULT: "#828282",
          light: "#C4C4C4"
        },
        primary: {
          DEFAULT: "#E31337",
          dark: "#CD1434"
        },
        black: {
          light: '#4F4F4F'
        }
      }
    },
    container: {
      screens: {
        sm: "100%",
        md: "100%",
        lg: "1024px",
        xl: "1280px"
      }
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
