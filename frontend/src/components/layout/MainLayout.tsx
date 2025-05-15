import React, { ReactNode } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Header from './Header'; // Ajuste o caminho se necessário
import Sidebar from './Sidebar'; // Ajuste o caminho se necessário

const drawerWidth = 240;

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // const [mobileOpen, setMobileOpen] = React.useState(false);

  // const handleDrawerToggle = () => {
  //   setMobileOpen(!mobileOpen);
  // };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header /> {/* handleDrawerToggle={handleDrawerToggle} - Adicionar se for implementar menu mobile */}
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // Altura padrão da AppBar do MUI
          backgroundColor: '#f4f6f8', // Um cinza claro para o fundo do conteúdo
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;

