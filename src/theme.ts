import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    border: {
      main: string;
    };
  }
  interface PaletteOptions {
    border?: {
      main?: string;
    };
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#101519', // Dark text color as primary
    },
    secondary: {
      main: '#57748e', // Secondary text/subtle color
    },
    background: {
      default: '#F9FAFB', // Light gray background
      paper: '#FFFFFF', // White for cards/paper
    },
    text: {
      primary: '#101519',
      secondary: '#57748e',
    },
    divider: '#d3dce4', // Border color
    border: {
      main: '#d4dce2', // New border color from tenant HTML
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans", sans-serif',
    h1: {
      fontSize: '32px', // From text-[32px]
      fontWeight: 700, // From font-bold
      lineHeight: 'tight', // From leading-tight
      letterSpacing: '-0.015em', // From tracking-[-0.015em]
      color: '#101519',
    },
    h2: {
      fontSize: '22px', // From text-[22px]
      fontWeight: 700, // From font-bold
      lineHeight: 'tight',
      letterSpacing: '-0.015em',
      color: '#101519',
    },
    h4: { // Used for "Property Manager"
      fontSize: '16px', // From text-base
      fontWeight: 500, // From font-medium
      lineHeight: 'normal',
      color: '#101519',
    },
    h5: { // Used for "Total Monthly Payments"
      fontSize: '16px', // From text-base
      fontWeight: 500, // From font-medium
      lineHeight: 'normal',
      color: '#101519',
    },
    h6: { // Used for "Total Recurring Expenses"
      fontSize: '16px', // From text-base
      fontWeight: 500, // From font-medium
      lineHeight: 'normal',
      color: '#101519',
    },
    body1: { // Default text
      fontSize: '14px', // From text-sm
      fontWeight: 400, // From font-normal
      lineHeight: 'normal',
      color: '#101519',
    },
    body2: { // Secondary text
      fontSize: '14px', // From text-sm
      fontWeight: 400, // From font-normal
      lineHeight: 'normal',
      color: '#5c748a', // Updated secondary text color
    },
    h3: {
      fontSize: '18px', // From text-lg
      fontWeight: 700, // From font-bold
      lineHeight: 'tight',
      letterSpacing: '-0.015em',
      color: '#101519',
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        margin: 'dense',
      },
    },
    MuiFormControl: {
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '9999px', // rounded-full
          height: '32px', // h-8
          padding: '0 16px', // px-4
          minWidth: '84px', // min-w-[84px]
          maxWidth: '480px', // max-w-[480px]
          fontSize: '14px', // text-sm
          fontWeight: 500, // font-medium
          lineHeight: 'normal',
          letterSpacing: '0.015em', // tracking-[0.015em]
          backgroundColor: '#e9edf1', // bg-[#e9edf1]
          color: '#101519', // text-[#101519]
          '&:hover': {
            backgroundColor: '#d3dce4', // A slightly darker shade for hover
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: '12px', // Rounded-xl
          border: '1px solid', // Use border from palette
          borderColor: '#d4dce2', // Updated border color
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: '12px', // Rounded-xl
          border: '1px solid', // Use border from palette
          borderColor: '#d4dce2', // Updated border color
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#F9FAFB',
          color: '#101519',
          borderBottom: '1px solid', // Use border from palette
          borderColor: 'divider',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px',
        },
      },
    },
    MuiList: {
      defaultProps: {
        dense: true,
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: '8px',
          paddingBottom: '8px',
          '&.Mui-selected': {
            backgroundColor: '#e9edf1',
            borderRadius: '8px', // Rounded-lg for selected item
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          borderBottom: '1px solid', // Use border from palette
          borderColor: '#d4dce2', // Updated border color
        },
        head: {
          backgroundColor: '#F9FAFB',
          color: '#101519',
          fontWeight: 500,
          fontSize: '14px',
        },
      },
    },
  },
});

export default theme;
