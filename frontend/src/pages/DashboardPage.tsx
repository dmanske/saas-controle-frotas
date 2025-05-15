import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

// Dados mockados para os cards do dashboard, conforme o wireframe
const dashboardData = {
  statusFrota: {
    total: 15,
    emOperacao: 9,
    emManutencao: 3,
    parados: 3,
  },
  alertasImportantes: [
    { id: 1, text: 'Manutenções Vencidas: 2', severity: 'error' },
    { id: 2, text: 'Documentos a Vencer: 4', severity: 'warning' },
    { id: 3, text: 'CNHs Vencidas: 1', severity: 'error' },
  ],
  custosMes: {
    total: 'R$ 12.500,00',
    // Poderia adicionar dados para um mini gráfico aqui
  },
  proximasManutencoes: [
    { id: 1, veiculo: 'ABE-1254', data: '20/08/2025', tipo: 'RC.3022' },
    { id: 2, veiculo: 'XY7-9578', data: '20/08/2025', tipo: 'Conativa' },
  ],
  consumoMedio: '7,5 KM/L',
  checklistsPendentes: 5,
};

const DashboardPage: React.FC = () => {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Card Status da Frota */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 200 }}>
            <Typography variant="h6" gutterBottom>Status da Frota</Typography>
            <Typography>Total de Veículos: {dashboardData.statusFrota.total}</Typography>
          </Paper>
        </Grid>

        {/* Card Alertas Importantes */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 200 }}>
            <Typography variant="h6" gutterBottom>Alertas Importantes</Typography>
            {dashboardData.alertasImportantes.map(alerta => (
              <Typography key={alerta.id}>{alerta.text}</Typography>
            ))}
          </Paper>
        </Grid>

        {/* Card Custos do Mês */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 200 }}>
            <Typography variant="h6" gutterBottom>Custos do Mês</Typography>
            <Typography variant="h5">{dashboardData.custosMes.total}</Typography>
            {/* Adicionar mini gráfico aqui se desejar */}
          </Paper>
        </Grid>

        {/* Card Próximas Manutenções */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 200 }}>
            <Typography variant="h6" gutterBottom>Próximas Manutenções</Typography>
            {dashboardData.proximasManutencoes.map(manut => (
              <Typography key={manut.id}>{manut.veiculo} - {manut.tipo} ({manut.data})</Typography>
            ))}
          </Paper>
        </Grid>

        {/* Card Consumo Médio */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="h6" gutterBottom>Consumo Médio da Frota</Typography>
            <Typography variant="h4">{dashboardData.consumoMedio}</Typography>
          </Paper>
        </Grid>

        {/* Card Checklists Pendentes */}
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="h6" gutterBottom>Checklists Pendentes</Typography>
            <Typography variant="h4">{dashboardData.checklistsPendentes}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default DashboardPage;

