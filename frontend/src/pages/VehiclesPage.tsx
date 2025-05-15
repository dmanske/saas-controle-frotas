import React, { useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, CircularProgress, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../supabase'; // Ajuste o caminho se necessário
import { Vehicle } from '../types/vehicle'; // Ajuste o caminho se necessário
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho se necessário

const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        // .eq('tenant_id', user.user_metadata.tenant_id) // Descomente quando o tenant_id estiver no user_metadata ou AuthContext
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      setVehicles(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar veículos:', err);
      setError(err.message || 'Falha ao carregar veículos.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo?')) {
      return;
    }
    try {
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .match({ id: vehicleId });

      if (deleteError) {
        throw deleteError;
      }
      // Atualiza a lista de veículos após a exclusão
      setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId));
    } catch (err: any) {
      console.error('Erro ao excluir veículo:', err);
      setError(err.message || 'Falha ao excluir veículo.');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gerenciamento de Veículos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/vehicles/new" // Rota para adicionar novo veículo
        >
          Adicionar Veículo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Placa</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>Modelo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhum veículo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.brand}</TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.type}</TableCell>
                    <TableCell>{vehicle.status}</TableCell>
                    <TableCell>
                      <IconButton 
                        component={RouterLink} 
                        to={`/vehicles/edit/${vehicle.id}`} // Rota para editar veículo
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => vehicle.id && handleDelete(vehicle.id)} 
                        color="error"
                        disabled={!vehicle.id} // Desabilita se o ID não estiver presente
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default VehiclesPage;

