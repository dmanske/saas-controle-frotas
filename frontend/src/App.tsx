import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleForm from './components/vehicles/VehicleForm';
import VehicleDetailPage from './pages/VehicleDetailPage'; // Importar VehicleDetailPage
import MaintenancesPage from './pages/MaintenancesPage';
import MaintenanceForm from './components/maintenances/MaintenanceForm';
import MaintenanceDetailPage from './pages/MaintenanceDetailPage';
import SuppliesPage from './pages/SuppliesPage'; // Importar SuppliesPage
import SupplyForm from './components/supplies/SupplyForm'; // Importar SupplyForm
import SupplyDetailPage from './pages/SupplyDetailPage'; // Importar SupplyDetailPage
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import CssBaseline from '@mui/material/CssBaseline';

// Placeholder para páginas futuras
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div>
    <h2>{title}</h2>
    <p>Conteúdo da página em desenvolvimento.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/" element={<ProtectedRoute />}>
              <Route index element={<MainLayout><DashboardPage /></MainLayout>} />
              <Route path="dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
              
              <Route path="vehicles" element={<MainLayout><VehiclesPage /></MainLayout>} />
              <Route path="vehicles/new" element={<MainLayout><VehicleForm /></MainLayout>} />
              <Route path="vehicles/edit/:id" element={<MainLayout><VehicleForm isEditMode={true} /></MainLayout>} />
              <Route path="vehicles/view/:id" element={<MainLayout><VehicleDetailPage /></MainLayout>} /> {/* Rota para Detalhes do Veículo */}

              {/* Rotas para Manutenções */}
              <Route path="maintenances" element={<MainLayout><MaintenancesPage /></MainLayout>} />
              <Route path="maintenances/new" element={<MainLayout><MaintenanceForm /></MainLayout>} />
              <Route path="maintenances/edit/:id" element={<MainLayout><MaintenanceForm isEditMode={true} /></MainLayout>} />
              <Route path="maintenances/view/:id" element={<MainLayout><MaintenanceDetailPage /></MainLayout>} />

              {/* Rotas para Abastecimentos */}
              <Route path="supplies" element={<MainLayout><SuppliesPage /></MainLayout>} />
              <Route path="supplies/new" element={<MainLayout><SupplyForm /></MainLayout>} />
              <Route path="supplies/edit/:id" element={<MainLayout><SupplyForm isEditMode={true} /></MainLayout>} />
              <Route path="supplies/view/:id" element={<MainLayout><SupplyDetailPage /></MainLayout>} />
              
              {/* Rotas com Placeholder */}
              <Route path="expenses" element={<MainLayout><PlaceholderPage title="Controle de Despesas" /></MainLayout>} />
              <Route path="drivers" element={<MainLayout><PlaceholderPage title="Gestão de Motoristas" /></MainLayout>} />
              <Route path="documents" element={<MainLayout><PlaceholderPage title="Gerenciamento de Documentos" /></MainLayout>} />
              <Route path="tires" element={<MainLayout><PlaceholderPage title="Controle de Pneus" /></MainLayout>} />
              <Route path="checklists" element={<MainLayout><PlaceholderPage title="Checklists de Veículos" /></MainLayout>} />
              <Route path="reports" element={<MainLayout><PlaceholderPage title="Relatórios Gerenciais" /></MainLayout>} />
              <Route path="settings" element={<MainLayout><PlaceholderPage title="Configurações do Sistema" /></MainLayout>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

