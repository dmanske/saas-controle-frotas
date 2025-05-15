import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Grid, MenuItem, CircularProgress, Alert } from '@mui/material';
import { supabase } from '../../supabase'; // Ajuste o caminho se necessário
import { Vehicle } from '../../types/vehicle'; // Ajuste o caminho se necessário
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho se necessário

interface VehicleFormProps {
  isEditMode?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ isEditMode = false }) => {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState<Partial<Vehicle>>({
    plate: '',
    brand: '',
    model: '',
    year_manufacture: new Date().getFullYear(),
    year_model: new Date().getFullYear(),
    type: 'car',
    current_km: 0,
    status: 'active',
    fuel_type: 'flex',
    // tenant_id: user?.user_metadata?.tenant_id // Descomente e ajuste quando o tenant_id estiver disponível
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && vehicleId) {
      const fetchVehicle = async () => {
        setLoading(true);
        try {
          const { data, error: fetchError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', vehicleId)
            .single();
          if (fetchError) throw fetchError;
          if (data) {
            setVehicle(data);
          } else {
            setError('Veículo não encontrado.');
          }
        } catch (err: any) {
          setError(err.message || 'Falha ao carregar dados do veículo.');
        } finally {
          setLoading(false);
        }
      };
      fetchVehicle();
    }
  }, [isEditMode, vehicleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }
    setVehicle(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!user) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
    }

    // Validação básica (pode ser expandida)
    if (!vehicle.plate || !vehicle.brand || !vehicle.model) {
        setError('Placa, Marca e Modelo são obrigatórios.');
        setLoading(false);
        return;
    }

    try {
        let response;
        const vehicleDataToSave = {
            ...vehicle,
            // tenant_id: vehicle.tenant_id || user.user_metadata.tenant_id, // Garanta que o tenant_id está sendo setado
            year_manufacture: Number(vehicle.year_manufacture),
            year_model: Number(vehicle.year_model),
            current_km: Number(vehicle.current_km),
            purchase_price: vehicle.purchase_price ? Number(vehicle.purchase_price) : undefined,
            average_consumption: vehicle.average_consumption ? Number(vehicle.average_consumption) : undefined,
        };

        if (isEditMode && vehicleId) {
            response = await supabase
                .from('vehicles')
                .update(vehicleDataToSave)
                .match({ id: vehicleId });
        } else {
            response = await supabase
                .from('vehicles')
                .insert([vehicleDataToSave]);
        }

        const { error: submissionError } = response;

        if (submissionError) {
            throw submissionError;
        }

        setSuccessMessage(isEditMode ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!');
        if (!isEditMode) {
            // Limpar formulário após cadastro bem-sucedido
            setVehicle({
                plate: '', brand: '', model: '', type: 'car', status: 'active', current_km: 0, year_manufacture: new Date().getFullYear(), year_model: new Date().getFullYear(), fuel_type: 'flex'
            });
        }
        setTimeout(() => navigate('/vehicles'), 1500); // Redireciona após mensagem de sucesso

    } catch (err: any) {
        console.error('Erro ao salvar veículo:', err);
        setError(err.message || 'Falha ao salvar veículo.');
    } finally {
        setLoading(false);
    }
  };

  if (loading && isEditMode && !vehicle.plate) { // Mostra loading apenas se estiver carregando para edição
    return <CircularProgress />;
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditMode ? 'Editar Veículo' : 'Adicionar Novo Veículo'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField name="plate" label="Placa" value={vehicle.plate || ''} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField name="brand" label="Marca" value={vehicle.brand || ''} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField name="model" label="Modelo" value={vehicle.model || ''} onChange={handleChange} fullWidth required />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="year_manufacture" label="Ano Fabricação" type="number" value={vehicle.year_manufacture || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="year_model" label="Ano Modelo" type="number" value={vehicle.year_model || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="current_km" label="KM Atual" type="number" value={vehicle.current_km || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select name="type" label="Tipo" value={vehicle.type || 'car'} onChange={handleChange} fullWidth>
              <MenuItem value="car">Carro</MenuItem>
              <MenuItem value="truck">Caminhão</MenuItem>
              <MenuItem value="motorcycle">Moto</MenuItem>
              <MenuItem value="machine">Máquina</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select name="status" label="Status" value={vehicle.status || 'active'} onChange={handleChange} fullWidth>
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="maintenance">Em Manutenção</MenuItem>
              <MenuItem value="inactive">Inativo</MenuItem>
              <MenuItem value="sold">Vendido</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select name="fuel_type" label="Tipo Combustível" value={vehicle.fuel_type || 'flex'} onChange={handleChange} fullWidth>
              <MenuItem value="gasoline">Gasolina</MenuItem>
              <MenuItem value="diesel">Diesel</MenuItem>
              <MenuItem value="ethanol">Etanol</MenuItem>
              <MenuItem value="electric">Elétrico</MenuItem>
              <MenuItem value="gas">Gás (GNV)</MenuItem>
              <MenuItem value="flex">Flex</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="average_consumption" label="Consumo Médio (km/L ou L/h)" type="number" value={vehicle.average_consumption || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="chassis" label="Chassi" value={vehicle.chassis || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="renavam" label="Renavam" value={vehicle.renavam || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="next_maintenance_date" label="Próxima Manutenção" type="date" value={vehicle.next_maintenance_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="document_due_date" label="Venc. Documento" type="date" value={vehicle.document_due_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="purchase_date" label="Data Compra" type="date" value={vehicle.purchase_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField name="purchase_price" label="Valor Compra" type="number" value={vehicle.purchase_price || ''} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField name="tire_details" label="Detalhes dos Pneus" value={vehicle.tire_details || ''} onChange={handleChange} fullWidth multiline rows={2} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="notes" label="Observações" value={vehicle.notes || ''} onChange={handleChange} fullWidth multiline rows={3} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => navigate('/vehicles')} sx={{ mr: 1 }} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Salvar Alterações' : 'Cadastrar Veículo')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default VehicleForm;

