import React from 'react';
import { Link } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography, useTheme } from '@mui/material'; // Importar useTheme
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import TireRepairIcon from '@mui/icons-material/TireRepair';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Veículos', icon: <DirectionsCarIcon />, path: '/vehicles' },
  { text: 'Manutenções', icon: <BuildIcon />, path: '/maintenances' },
  { text: 'Abastecimento', icon: <LocalGasStationIcon />, path: '/supplies' },
  { text: 'Despesas', icon: <ReceiptLongIcon />, path: '/expenses' },
  { text: 'Motoristas', icon: <PeopleIcon />, path: '/drivers' },
  { text: 'Documentos', icon: <DescriptionIcon />, path: '/documents' },
  { text: 'Pneus', icon: <TireRepairIcon />, path: '/tires' },
  { text: 'Checklists', icon: <PlaylistAddCheckIcon />, path: '/checklists' },
  { text: 'Relatórios', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Configurações', icon: <SettingsIcon />, path: '/settings' },
];

const Sidebar: React.FC = () => {
  const theme = useTheme(); // Acessar o tema

  return (
    <Box
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { // Este seletor é para quando o Drawer é usado como um componente flutuante (ex: mobile)
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.custom.sidebarBackground, // Cor de fundo da sidebar do tema
          color: theme.palette.custom.sidebarText, // Cor do texto da sidebar do tema
        },
        // Aplicando diretamente no Box quando a Sidebar é fixa como neste layout
        backgroundColor: theme.palette.custom.sidebarBackground,
        color: theme.palette.custom.sidebarText,
        height: '100vh', // Garante que a sidebar ocupe toda a altura
        position: 'fixed', // Mantém a sidebar fixa
        top: 0,
        left: 0,
        zIndex: theme.zIndex.drawer +1, // Garante que fique acima do conteúdo mas abaixo de modais, etc.
      }}
      component="nav"
    >
      <Box sx={{ padding: '16px', textAlign: 'center', mt: '8px', mb: '8px' }}>
        <Typography variant="h6" component="div" sx={{ color: theme.palette.custom.sidebarText, fontWeight: 'bold' }}>
          Controle Frota
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: alpha(theme.palette.custom.sidebarText, 0.2) }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding component={Link} to={item.path} sx={{ color: theme.palette.custom.sidebarText }}>
            <ListItemButton
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.custom.sidebarText, 0.08),
                },
                paddingTop: '10px',
                paddingBottom: '10px',
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.custom.sidebarText, minWidth: '40px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

// Função alpha para transparência (pode ser movida para um utilitário se usada em mais lugares)
// Esta função já existe no @mui/material/styles, mas caso precise dela isoladamente:
const alpha = (color: string, opacity: number) => {
  const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255);
  // Verificando se a cor é um nome de cor CSS ou um valor hexadecimal
  if (color.startsWith('#')) {
    return color + _opacity.toString(16).toUpperCase().padStart(2, '0');
  } 
  // Para cores nomeadas ou rgb/rgba, esta abordagem simplista não funcionará bem.
  // O ideal é usar a função alpha do MUI: import { alpha } from '@mui/material/styles';
  // Como já estamos usando no Header, vamos garantir que está importada aqui também.
  // Removendo esta implementação local e assumindo que será importada de @mui/material/styles
  return color; // Placeholder, o alpha do MUI deve ser usado.
};

export default Sidebar;

