import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Box, Typography, Button, Paper, TextField, MenuItem, Grid, 
    CircularProgress, Alert, FormControl, InputLabel, Select, OutlinedInput, FormHelperText 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { supabase } from '../../services/supabase'; // Ajuste o caminho
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho
import { MaintenanceFormData, MaintenanceStatusType, MaintenanceCategoryType } from '../../types/maintenance'; // Ajuste o caminho
import { Vehicle } from '../../types/vehicle'; // Ajuste o caminho

interface MaintenanceFormProps {
    isEditMode?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ isEditMode = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id: maintenanceId } = useParams<{ id: string }>(); // Para modo de edição

    const [formData, setFormData] = useState<MaintenanceFormData>({
        vehicle_id: '',
        maintenance_type: 'preventiva',
        description: '',
        scheduled_date: '',
        completion_date: '',
        cost_parts: '',
        cost_services: '',
        supplier_name: '',
        status: 'pendente',
        notes: '',
    });
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof MaintenanceFormData, string>>>({});

    const maintenanceStatusOptions: MaintenanceStatusType[] = ['agendada', 'em andamento', 'concluída', 'cancelada', 'pendente'];
    const maintenanceCategoryOptions: MaintenanceCategoryType[] = ['preventiva', 'corretiva', 'preditiva', 'melhoria', 'outra'];

    const fetchVehicles = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) {
            console.log('Usuário ou tenant_id não encontrado:', { user, tenant_id: user?.user_metadata?.tenant_id });
            return;
        }
        try {
            console.log('Buscando veículos para o tenant:', user.user_metadata.tenant_id);
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('plate', { ascending: true });

            if (error) {
                console.error('Erro na consulta:', error);
                throw error;
            }

            console.log('Veículos encontrados:', data);
            setVehicles(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar veículos:', err);
            setFormError('Falha ao carregar lista de veículos: ' + (err.message || 'Erro desconhecido'));
        }
    }, [user]);

    const fetchMaintenanceDetails = useCallback(async (id: string) => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('maintenances')
                .select('*')
                .eq('id', id)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();
            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    cost_parts: data.cost_parts?.toString() || '',
                    cost_services: data.cost_services?.toString() || '',
                    scheduled_date: data.scheduled_date ? data.scheduled_date.split('T')[0] : '',
                    completion_date: data.completion_date ? data.completion_date.split('T')[0] : '',
                });
            }
        } catch (err: any) {
            console.error('Erro ao buscar detalhes da manutenção:', err);
            setFormError('Falha ao carregar dados da manutenção para edição.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        console.log('Iniciando busca de veículos...');
        fetchVehicles();
        if (isEditMode && maintenanceId) {
            fetchMaintenanceDetails(maintenanceId);
        }
    }, [fetchVehicles, isEditMode, maintenanceId, fetchMaintenanceDetails]);

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof MaintenanceFormData, string>> = {};
        if (!formData.vehicle_id) errors.vehicle_id = 'Veículo é obrigatório.';
        if (!formData.description.trim()) errors.description = 'Descrição é obrigatória.';
        if (!formData.maintenance_type) errors.maintenance_type = 'Tipo de manutenção é obrigatório.';
        if (!formData.status) errors.status = 'Status é obrigatório.';
        
        if (formData.cost_parts && isNaN(parseFloat(formData.cost_parts))) {
            errors.cost_parts = 'Custo das peças deve ser um número válido.';
        }
        if (formData.cost_services && isNaN(parseFloat(formData.cost_services))) {
            errors.cost_services = 'Custo dos serviços deve ser um número válido.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target as HTMLInputElement; // Type assertion
        setFormData(prev => ({ ...prev, [name!]: value }));
        if (validationErrors[name as keyof MaintenanceFormData]) {
            setValidationErrors(prev => ({ ...prev, [name!]: undefined }));
        }
    };
    
    const handleSelectChange = (e: any) => { // MUI SelectChangeEvent
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name!]: value as string }));
        if (validationErrors[name as keyof MaintenanceFormData]) {
            setValidationErrors(prev => ({ ...prev, [name!]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !user.user_metadata?.tenant_id) {
            setFormError('Usuário não autenticado ou tenant ID não encontrado.');
            return;
        }
        if (!validateForm()) {
            setFormError('Por favor, corrija os erros no formulário.');
            return;
        }

        setLoading(true);
        setFormError(null);

        console.log('Usuário logado:', user);
        
        // Pegando tenant_id do usuário de forma robusta
        const tenantId = user.user_metadata?.tenant_id || 'bda52dfb-1543-4718-b3e9-9523919d8e11';
        
        console.log('TenantID a ser usado:', tenantId);
        
        try {
            if (isEditMode && maintenanceId) {
                // Atualização de manutenção existente
                const { error } = await supabase
                    .from('maintenances')
                    .update({
                        vehicle_id: formData.vehicle_id,
                        maintenance_type: formData.maintenance_type,
                        description: formData.description,
                        scheduled_date: formData.scheduled_date || null,
                        completion_date: formData.completion_date || null,
                        cost_parts: formData.cost_parts ? parseFloat(formData.cost_parts) : 0,
                        cost_services: formData.cost_services ? parseFloat(formData.cost_services) : 0,
                        supplier_name: formData.supplier_name || '',
                        status: formData.status,
                        notes: formData.notes || '',
                        tenant_id: tenantId
                    })
                    .eq('id', maintenanceId);
                
                if (error) throw error;
                navigate('/maintenances');
            } else {
                // Inserção de nova manutenção
                const { error } = await supabase
                    .from('maintenances')
                    .insert([{
                        vehicle_id: formData.vehicle_id,
                        maintenance_type: formData.maintenance_type,
                        description: formData.description,
                        scheduled_date: formData.scheduled_date || null,
                        completion_date: formData.completion_date || null,
                        cost_parts: formData.cost_parts ? parseFloat(formData.cost_parts) : 0,
                        cost_services: formData.cost_services ? parseFloat(formData.cost_services) : 0,
                        supplier_name: formData.supplier_name || '',
                        status: formData.status,
                        notes: formData.notes || '',
                        tenant_id: tenantId
                    }]);
                
                if (error) {
                    console.error('Erro detalhado:', error);
                    throw error;
                }
                navigate('/maintenances');
            }
        } catch (err: any) {
            console.error('Erro ao salvar manutenção:', err);
            setFormError(`Falha ao salvar manutenção: ${err.message || 'Erro desconhecido.'}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) {
        return (
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '50vh' 
            }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom component="div">
                {isEditMode ? 'Editar Manutenção' : 'Adicionar Nova Manutenção'}
            </Typography>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth error={!!validationErrors.vehicle_id}>
                            <InputLabel id="vehicle-select-label">Veículo *</InputLabel>
                            <Select
                                labelId="vehicle-select-label"
                                id="vehicle_id"
                                name="vehicle_id"
                                value={formData.vehicle_id}
                                onChange={handleSelectChange}
                                label="Veículo *"
                                input={<OutlinedInput label="Veículo *" />}
                            >
                                <MenuItem value=""><em>Selecione um veículo</em></MenuItem>
                                {vehicles.length === 0 ? (
                                    <MenuItem disabled>
                                        <em>Nenhum veículo encontrado</em>
                                    </MenuItem>
                                ) : (
                                    vehicles.map(v => (
                                        <MenuItem key={v.id} value={v.id}>
                                            {v.plate} - {v.brand} {v.model}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                            {validationErrors.vehicle_id && <FormHelperText>{validationErrors.vehicle_id}</FormHelperText>}
                            {vehicles.length === 0 && !loading && (
                                <FormHelperText error>
                                    Nenhum veículo cadastrado. Por favor, cadastre um veículo primeiro.
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Tipo de Manutenção *"
                            name="maintenance_type"
                            value={formData.maintenance_type}
                            onChange={handleSelectChange} // Usar handleSelectChange para TextField select
                            fullWidth
                            error={!!validationErrors.maintenance_type}
                            helperText={validationErrors.maintenance_type}
                        >
                            {maintenanceCategoryOptions.map(option => (
                                <MenuItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Descrição *"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                            error={!!validationErrors.description}
                            helperText={validationErrors.description}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Data Agendada"
                            name="scheduled_date"
                            type="date"
                            value={formData.scheduled_date || ''}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Data de Conclusão"
                            name="completion_date"
                            type="date"
                            value={formData.completion_date || ''}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Custo das Peças (R$)"
                            name="cost_parts"
                            type="number"
                            value={formData.cost_parts}
                            onChange={handleChange}
                            fullWidth
                            InputProps={{ inputProps: { step: "0.01" } }}
                            error={!!validationErrors.cost_parts}
                            helperText={validationErrors.cost_parts}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Custo dos Serviços (R$)"
                            name="cost_services"
                            type="number"
                            value={formData.cost_services}
                            onChange={handleChange}
                            fullWidth
                            InputProps={{ inputProps: { step: "0.01" } }}
                            error={!!validationErrors.cost_services}
                            helperText={validationErrors.cost_services}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Fornecedor/Oficina"
                            name="supplier_name"
                            value={formData.supplier_name || ''}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Status *"
                            name="status"
                            value={formData.status}
                            onChange={handleSelectChange} // Usar handleSelectChange para TextField select
                            fullWidth
                            error={!!validationErrors.status}
                            helperText={validationErrors.status}
                        >
                            {maintenanceStatusOptions.map(option => (
                                <MenuItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Notas Adicionais"
                            name="notes"
                            value={formData.notes || ''}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                        <Button 
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => navigate('/maintenances')}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            startIcon={<SaveIcon />} 
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Atualizar Manutenção' : 'Salvar Manutenção')}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default MaintenanceForm;

