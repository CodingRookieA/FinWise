import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0B1120',
      paper: '#1A2332',
    },
    primary: {
      main: '#0EA5E9',
      contrastText: '#0B1120',
    },
    secondary: {
      main: '#10B981',
      contrastText: '#0B1120',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#8B9DC3',
      subText: '#94A3B8'
    },
    divider: '#2A3A4E',
  },
  typography: {
    fontFamily: "'DM sans', system-ui, sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
        },
        sizeLarge: {
          padding: '14px 40px',
          fontSize: '1.1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A2332',
          border: '1px solid #2A3A4E',
        },
      },
    },
  },
});

export default theme;
