// resources/js/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#10B981', // Emerald
      contrastText: '#fff',
    },
    secondary: {
      main: '#3B82F6', // Indigo
      contrastText: '#fff',
    },
    error: {
      main: '#EF4444', // Red
    },
    background: {
      default: '#F9FAFB', // App background
      paper: '#FFFFFF',   // Card / box backgrounds
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Noto Sans Arabic", sans-serif',
    fontSize: 14,
    h6: { fontWeight: 600 },
    body1: { fontWeight: 400 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: '8px',
        },
      },
    },
  },
});

export default theme;
