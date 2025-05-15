import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Box, Avatar, useTheme } from '@mui/material'; // Importar useTheme
import { styled, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

// O Search e StyledInputBase usam 'theme' internamente, então eles se adaptarão ao tema fornecido pelo ThemeProvider.
// A cor de fundo do Search é baseada em theme.palette.common.white, que é apropriado se o AppBar for claro.
// O tema já define o AppBar como branco com texto escuro.
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  // Usando alpha(theme.palette.text.primary, 0.05) para um contraste sutil com o fundo branco do header
  backgroundColor: alpha(theme.palette.text.primary, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.1),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit', // Herdará a cor do texto do AppBar, que é theme.palette.custom.headerText
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface HeaderProps {
  handleDrawerToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ handleDrawerToggle }) => {
  const { user, signOut } = useAuth();
  const theme = useTheme(); // Acessar o tema para usar suas cores
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AppBar
      position="fixed"
      // As cores de fundo e texto são agora controladas pelo MuiAppBar styleOverrides no theme.ts
      // backgroundColor e color foram removidos daqui.
      // O boxShadow também é controlado pelo tema.
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        // Exemplo de como usar a cor customizada do tema se necessário diretamente:
        // backgroundColor: theme.palette.custom.headerBackground,
        // color: theme.palette.custom.headerText,
      }}
    >
      <Toolbar>
        {/* Ícone do menu para mobile, se necessário */}
        {/* 
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton> 
        */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="h6" noWrap component="div" color="inherit">
            Dashboard
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {formattedDate}
          </Typography>
        </Box>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Buscar..."
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>
        <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
          <IconButton size="large" aria-label="show 17 new notifications" color="inherit">
            <NotificationsIcon />
          </IconButton>
          <Typography sx={{ mx: 1 }} color="inherit">{user?.email ? user.email.split('@')[0] : 'Admin'}</Typography>
          <IconButton onClick={signOut} sx={{ p: 0, ml:1 }}>
            <Avatar alt={user?.email || "Admin"} src={user?.user_metadata?.avatar_url || "/static/images/avatar/2.jpg"} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

