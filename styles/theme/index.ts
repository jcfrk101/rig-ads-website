import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0ADC6A',
      dark: '#08b857',
      contrastText: '#000000',
    },
    secondary: {
      main: '#323E48',
    },
    background: {
      default: '#ffffff',
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#4a4a5a',
    },
  },

  typography: {
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '1rem',
        },
        containedPrimary: {
          backgroundColor: '#0ADC6A',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#08b857',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
    },
  },
})

export default theme
