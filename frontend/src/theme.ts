import { createTheme } from '@mui/material/styles';

// Paleta de cores definida
const theme = createTheme({
  palette: {
    primary: {
      main: '#007BFF', // Azul vibrante para botões de ação primária e elementos principais
    },
    secondary: {
      main: '#6C757D', // Cinza para textos secundários, placeholders
    },
    background: {
      default: '#F0F2F5', // Cinza muito sutil para o fundo da área de conteúdo principal
      paper: '#FFFFFF',    // Branco para cards, modais, tabelas, formulários
    },
    text: {
      primary: '#212529',   // Cor escura para texto principal
      secondary: '#6C757D', // Cinza para texto secundário
    },
    custom: {
      sidebarBackground: '#1A2B4E',
      sidebarText: '#FFFFFF',
      headerBackground: '#FFFFFF', // Ou #F8F9FA
      headerText: '#343A40',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    // Você pode definir outras customizações de tipografia aqui
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF', // Cor de fundo do Header (AppBar)
          color: '#343A40', // Cor do texto do Header (AppBar)
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.06), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.04)', // Sombra sutil para o header
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A2B4E',
          color: '#FFFFFF',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Bordas levemente arredondadas para botões
        },
        containedPrimary: {
          color: '#FFFFFF', // Texto branco para botões primários
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px', // Bordas mais arredondadas para cards
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)', // Sombra mais suave para cards
        },
      },
    },
    // Outras customizações de componentes podem ser adicionadas aqui
  },
});

// Estendendo a interface PaletteOptions e Palette para incluir a cor customizada
declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      sidebarBackground: string;
      sidebarText: string;
      headerBackground: string;
      headerText: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      sidebarBackground?: string;
      sidebarText?: string;
      headerBackground?: string;
      headerText?: string;
    };
  }
}

export default theme;

