import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
    Box, Typography, Paper, CircularProgress, Alert, Grid, Button, Divider, Chip 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { Maintenance } from '../types/maintenance';

interface MaintenanceWithVehicles {
    id: string;
    created_at: string;
    tenant_id: string;
    vehicle_id: string;
    maintenance_type: string;
    description: string;
    scheduled_date: string | null;
    completion_date: string | null;
    cost_parts: number | null;
    cost_services: number | null;
    total_cost: number | null;
    supplier_name: string | null;
    status: string;
    notes: string | null;
    vehicles: {
        id: string;
        plate: string;
        model: string;
        brand: string;
    } | {
        id: string;
        plate: string;
        model: string;
        brand: string;
    }[];
}

const MaintenanceDetailPage: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMaintenanceDetails = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('maintenances')
                .select(`
                    id, created_at, tenant_id, vehicle_id, maintenance_type, description, 
                    scheduled_date, completion_date, cost_parts, cost_services, total_cost, 
                    supplier_name, status, notes,
                    vehicles (id, plate, model, brand)
                `)
                .eq('id', id)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();

            if (error) throw error;
            if (data) {
                const maintenanceData = data as MaintenanceWithVehicles;
                // Mapear para garantir que vehicle seja um objeto e incluir todos os campos necessários
                const formattedData: Maintenance = {
                    id: maintenanceData.id,
                    created_at: maintenanceData.created_at,
                    tenant_id: maintenanceData.tenant_id,
                    vehicle_id: maintenanceData.vehicle_id,
                    maintenance_type: maintenanceData.maintenance_type as any,
                    description: maintenanceData.description,
                    scheduled_date: maintenanceData.scheduled_date || undefined,
                    completion_date: maintenanceData.completion_date || undefined,
                    cost_parts: maintenanceData.cost_parts || undefined,
                    cost_services: maintenanceData.cost_services || undefined,
                    total_cost: maintenanceData.total_cost || undefined,
                    supplier_name: maintenanceData.supplier_name || undefined,
                    status: maintenanceData.status as any,
                    notes: maintenanceData.notes || undefined,
                    vehicle: Array.isArray(maintenanceData.vehicles) ? {
                        plate: maintenanceData.vehicles[0].plate,
                        brand: maintenanceData.vehicles[0].brand,
                        model: maintenanceData.vehicles[0].model
                    } : {
                        plate: maintenanceData.vehicles.plate,
                        brand: maintenanceData.vehicles.brand,
                        model: maintenanceData.vehicles.model
                    }
                };
                setMaintenance(formattedData);
            } else {
                setError('Manutenção não encontrada.');
            }
        } catch (err: any) {
            console.error('Erro ao buscar detalhes da manutenção:', err);
            setError('Falha ao carregar detalhes da manutenção.');
        } finally {
            setLoading(false);
        }
    }, [user, id]);

    useEffect(() => {
        fetchMaintenanceDetails();
    }, [fetchMaintenanceDetails]);

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>{label}</Typography>
            <Typography variant="body1">{value || 'N/A'}</Typography>
        </Grid>
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!maintenance) return <Alert severity="info">Detalhes da manutenção não disponíveis.</Alert>;

    return (
        <Paper sx={{ p: 3, margin: 'auto', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="div">
                    Detalhes da Manutenção
                </Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/maintenances')}
                        sx={{ mr: 1 }}
                    >
                        Voltar para Lista
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        component={RouterLink}
                        to={`/maintenances/edit/${maintenance.id}`}
                    >
                        Editar Manutenção
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="h6">Informações do Veículo</Typography></Grid>
                <DetailItem label="Placa do Veículo" value={maintenance.vehicle?.plate} />
                <DetailItem label="Modelo do Veículo" value={`${maintenance.vehicle?.brand || ''} ${maintenance.vehicle?.model || ''}`} />
                
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Detalhes da Manutenção" /></Divider></Grid>
                
                <DetailItem label="Tipo de Manutenção" value={maintenance.maintenance_type.charAt(0).toUpperCase() + maintenance.maintenance_type.slice(1)} />
                <DetailItem label="Status" value={<Chip label={maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)} color={maintenance.status === 'concluída' ? 'success' : maintenance.status === 'cancelada' ? 'error' : maintenance.status === 'em andamento' ? 'warning' : 'default'} />} />
                <DetailItem label="Data Agendada" value={maintenance.scheduled_date ? new Date(maintenance.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'} />
                <DetailItem label="Data de Conclusão" value={maintenance.completion_date ? new Date(maintenance.completion_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'} />
                <DetailItem label="Fornecedor/Oficina" value={maintenance.supplier_name} />
                
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Custos" /></Divider></Grid>
                <DetailItem label="Custo das Peças" value={`R$ ${Number(maintenance.cost_parts).toFixed(2)}`} />
                <DetailItem label="Custo dos Serviços" value={`R$ ${Number(maintenance.cost_services).toFixed(2)}`} />
                <DetailItem label="Custo Total" value={`R$ ${Number(maintenance.total_cost).toFixed(2)}`} />
                
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Observações" /></Divider></Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Descrição do Serviço</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{maintenance.description || 'Nenhuma descrição fornecida.'}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Notas Adicionais</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{maintenance.notes || 'Nenhuma nota adicional.'}</Typography>
                </Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <DetailItem label="ID da Manutenção" value={maintenance.id} />
                <DetailItem label="Registrado em" value={maintenance.created_at ? new Date(maintenance.created_at).toLocaleString('pt-BR') : 'N/A'} />
            </Grid>
        </Paper>
    );
};

export default MaintenanceDetailPage;

