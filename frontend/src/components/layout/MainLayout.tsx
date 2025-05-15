import React, { ReactNode } from 'react';
import { Box, CssBaseline, useTheme } from '@mui/material'; // Importar useTheme
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 240;

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme(); // Acessar o tema

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // Altura padrão da AppBar do MUI
          backgroundColor: theme.palette.background.default, // Usar a cor de fundo do tema
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;

