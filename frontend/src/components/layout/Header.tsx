import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, InputBase, Box, Avatar } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu'; // Para um possível botão de menu mobile
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho se necessário

const drawerWidth = 240;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
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
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

interface HeaderProps {
  handleDrawerToggle?: () => void; // Para menu mobile, opcional
}

const Header: React.FC<HeaderProps> = ({ handleDrawerToggle }) => {
  const { user, signOut } = useAuth();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
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
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
          {/* Título da página atual pode vir aqui dinamicamente ou o nome do Dashboard */}
          {/* Exemplo: Dashboard */}
          <Typography variant="subtitle2" color="textSecondary">
            {formattedDate}
          </Typography>
        </Typography>

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
            {/* <Badge badgeContent={17} color="error"> */}
              <NotificationsIcon />
            {/* </Badge> */}
          </IconButton>
          <Typography sx={{ mx: 1 }}>{user?.email ? user.email.split('@')[0] : 'Admin'}</Typography>
          <IconButton onClick={signOut} sx={{ p: 0, ml:1 }}>
            <Avatar alt={user?.email || "Admin"} src={user?.user_metadata?.avatar_url || "/static/images/avatar/2.jpg"} />
          </IconButton>
          {/* Implementar menu dropdown para perfil e logout aqui */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

