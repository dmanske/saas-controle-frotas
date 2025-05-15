import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout'; // Importar MainLayout
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage'; // Importar VehiclesPage
import VehicleForm from './components/vehicles/VehicleForm'; // Importar VehicleForm

// Placeholder para páginas futuras (pode ser mantido ou removido conforme necessário)
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div>
    <h2>{title}</h2>
    <p>Conteúdo da página em desenvolvimento.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rotas Protegidas */}
          <Route path="/" element={<ProtectedRoute />}>
            {/* Envolver rotas filhas com MainLayout */}
            <Route index element={<MainLayout><DashboardPage /></MainLayout>} />
            <Route path="dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
            <Route path="vehicles" element={<MainLayout><VehiclesPage /></MainLayout>} />
            <Route path="vehicles/new" element={<MainLayout><VehicleForm /></MainLayout>} />
            <Route path="vehicles/edit/:id" element={<MainLayout><VehicleForm isEditMode={true} /></MainLayout>} />
            
            {/* Rotas com Placeholder ainda usando MainLayout para consistência */}
            <Route path="maintenances" element={<MainLayout><PlaceholderPage title="Controle de Manutenções" /></MainLayout>} />
            <Route path="supplies" element={<MainLayout><PlaceholderPage title="Gestão de Abastecimento" /></MainLayout>} />
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
  );
};

export default App;

