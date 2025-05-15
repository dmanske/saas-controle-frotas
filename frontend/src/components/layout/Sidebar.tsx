import React from 'react';
import { Link } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import TireRepairIcon from '@mui/icons-material/TireRepair'; // Ícone para Pneus
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'; // Ícone para Checklists
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
  return (
    <Box
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1A2B4E', // Azul escuro similar à referência
          color: 'white',
        },
      }}
      component="nav"
    >
      <Box sx={{ padding: '16px', textAlign: 'center' }}>
        <Typography variant="h6" component="div" sx={{ color: 'white', fontWeight: 'bold' }}>
          Controle Frota
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding component={Link} to={item.path} sx={{ color: 'white' }}>
            <ListItemButton
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}>
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

export default Sidebar;

