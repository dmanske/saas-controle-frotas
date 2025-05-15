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
import { SupplyFormData, FuelCategoryType, fuelTypeOptions } from '../../types/supply'; // Ajuste o caminho
import { Vehicle } from '../../types/vehicle'; // Ajuste o caminho
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

interface SupplyFormProps {
    isEditMode?: boolean;
}

interface Driver {
    id: string;
    name: string;
}

const SupplyForm: React.FC<SupplyFormProps> = ({ isEditMode = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id: supplyId } = useParams<{ id: string }>(); // Para modo de edição

    const [formData, setFormData] = useState<SupplyFormData>({
        vehicle_id: '',
        supply_date: new Date().toISOString().slice(0, 16), // Data e hora atual como padrão
        odometer_reading: '',
        fuel_type: 'gasolina comum',
        quantity_liters: '',
        price_per_unit: '',
        gas_station_name: '',
        invoice_number: '',
        driver_id: null, // ou '' dependendo da sua lógica
        notes: '',
    });
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof SupplyFormData, string>>>({});
    const [useDefaultPrice, setUseDefaultPrice] = useState(false);
    const [defaultPrice, setDefaultPrice] = useState('');
    const [tenantSettings, setTenantSettings] = useState<{ default_station_name?: string; default_price_per_liter?: string } | null>(null);
    const [fuelPrices, setFuelPrices] = useState<{ [key: string]: string }>({});

    const fetchVehicles = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('plate', { ascending: true });
            if (error) throw error;
            setVehicles(data as Vehicle[] || []);
        } catch (err: any) {
            console.error('Erro ao buscar veículos:', err);
            setFormError('Falha ao carregar lista de veículos.');
        }
    }, [user]);

    const fetchDrivers = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('id, name')
                .eq('tenant_id', user.user_metadata.tenant_id)
                .eq('active', true)
                .order('name', { ascending: true });
            if (error) throw error;
            setDrivers(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar motoristas:', err);
        }
    }, [user]);

    const fetchTenantSettings = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const { data, error } = await supabase
                .from('tenant_settings')
                .select('default_station_name, default_price_per_liter')
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();
            if (error) throw error;
            setTenantSettings(data);
        } catch (err: any) {
            console.error('Erro ao buscar configurações do tenant:', err);
        }
    }, [user]);

    const fetchFuelPrices = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const { data, error } = await supabase
                .from('tenant_fuel_prices')
                .select('fuel_type, price_per_liter')
                .eq('tenant_id', user.user_metadata.tenant_id);
            if (error) throw error;
            const prices: { [key: string]: string } = {};
            data?.forEach((row: any) => {
                prices[row.fuel_type] = row.price_per_liter;
            });
            setFuelPrices(prices);
        } catch (err: any) {
            console.error('Erro ao buscar preços de combustíveis:', err);
        }
    }, [user]);

    const fetchSupplyDetails = useCallback(async (id: string) => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('supplies')
                .select('*')
                .eq('id', id)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();
            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    odometer_reading: data.odometer_reading?.toString() || '',
                    quantity_liters: data.quantity_liters?.toString() || '',
                    price_per_unit: data.price_per_unit?.toString() || '',
                    supply_date: data.supply_date ? new Date(data.supply_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                });
            }
        } catch (err: any) {
            console.error('Erro ao buscar detalhes do abastecimento:', err);
            setFormError('Falha ao carregar dados do abastecimento para edição.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchVehicles();
        fetchDrivers();
        fetchTenantSettings();
        fetchFuelPrices();
        if (isEditMode && supplyId) {
            fetchSupplyDetails(supplyId);
        }
    }, [fetchVehicles, fetchDrivers, fetchTenantSettings, isEditMode, supplyId, fetchSupplyDetails, fetchFuelPrices]);

    useEffect(() => {
        // Quando o veículo selecionado mudar, atualize o tipo de combustível automaticamente
        if (formData.vehicle_id && vehicles.length > 0) {
            const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
            if (selectedVehicle) {
                setFormData(prev => ({ ...prev, fuel_type: selectedVehicle.fuel_type as FuelCategoryType }));
            }
        }
        // eslint-disable-next-line
    }, [formData.vehicle_id, vehicles]);

    useEffect(() => {
        if (useDefaultPrice && formData.fuel_type && fuelPrices) {
            setFormData(prev => ({
                ...prev,
                price_per_unit: fuelPrices[prev.fuel_type] || '',
            }));
        }
        // eslint-disable-next-line
    }, [formData.fuel_type, useDefaultPrice, fuelPrices]);

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof SupplyFormData, string>> = {};
        if (!formData.vehicle_id) errors.vehicle_id = 'Veículo é obrigatório.';
        if (!formData.supply_date) errors.supply_date = 'Data do abastecimento é obrigatória.';
        if (!String(formData.odometer_reading).trim() || isNaN(Number(formData.odometer_reading)) || Number(formData.odometer_reading) <= 0) {
            errors.odometer_reading = 'Kilometragem deve ser um número positivo.';
        }
        if (!formData.fuel_type) errors.fuel_type = 'Tipo de combustível é obrigatório.';
        if (!String(formData.quantity_liters).trim() || isNaN(Number(formData.quantity_liters)) || Number(formData.quantity_liters) <= 0) {
            errors.quantity_liters = 'Quantidade deve ser um número positivo.';
        }
        if (!String(formData.price_per_unit).trim() || isNaN(Number(formData.price_per_unit)) || Number(formData.price_per_unit) <= 0) {
            errors.price_per_unit = 'Preço por litro deve ser um número positivo.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name!]: value }));
        if (validationErrors[name as keyof SupplyFormData]) {
            setValidationErrors(prev => ({ ...prev, [name!]: undefined }));
        }
        if (name === 'price_per_unit' && useDefaultPrice) {
            setDefaultPrice(value);
        }
    };
    
    const handleSelectChange = (e: any) => { // MUI SelectChangeEvent
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name!]: value as string }));
        if (validationErrors[name as keyof SupplyFormData]) {
            setValidationErrors(prev => ({ ...prev, [name!]: undefined }));
        }
    };

    const handleDefaultPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDefaultPrice(e.target.value);
        if (useDefaultPrice) {
            setFormData(prev => ({ ...prev, price_per_unit: e.target.value }));
        }
    };

    const handleUseDefaultPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUseDefaultPrice(e.target.checked);
        if (e.target.checked && formData.fuel_type && fuelPrices) {
            setFormData(prev => ({
                ...prev,
                price_per_unit: fuelPrices[prev.fuel_type] || '',
                gas_station_name: tenantSettings?.default_station_name || '',
            }));
            setDefaultPrice(fuelPrices[formData.fuel_type] || '');
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
        const total_cost = parseFloat(formData.quantity_liters) * parseFloat(formData.price_per_unit);
        const dataToSave = {
            ...formData,
            tenant_id: user.user_metadata.tenant_id,
            odometer_reading: parseInt(formData.odometer_reading),
            quantity_liters: parseFloat(formData.quantity_liters),
            price_per_unit: parseFloat(formData.price_per_unit),
            supply_date: new Date(formData.supply_date).toISOString(),
            total_cost,
        };
        try {
            if (isEditMode && supplyId) {
                const { error } = await supabase
                    .from('supplies')
                    .update(dataToSave)
                    .eq('id', supplyId)
                    .eq('tenant_id', user.user_metadata.tenant_id);
                if (error) throw error;
                navigate('/supplies');
            } else {
                const { error } = await supabase
                    .from('supplies')
                    .insert(dataToSave);
                if (error) throw error;
                navigate('/supplies');
            }
        } catch (err: any) {
            console.error('Erro ao salvar abastecimento:', err);
            setFormError(`Falha ao salvar abastecimento: ${err.message || 'Erro desconhecido.'}`);
        } finally {
            setLoading(false);
        }
    };

    const fuelTypeLabel = fuelTypeOptions.find(opt => opt.value === formData.fuel_type)?.label || formData.fuel_type;

    if (loading && isEditMode && !formError) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom component="div">
                {isEditMode ? 'Editar Registro de Abastecimento' : 'Registrar Novo Abastecimento'}
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
                                {vehicles.map(v => (
                                    <MenuItem key={v.id} value={v.id}>{v.plate} - {v.model}</MenuItem>
                                ))}
                            </Select>
                            {validationErrors.vehicle_id && <FormHelperText>{validationErrors.vehicle_id}</FormHelperText>}
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Data e Hora do Abastecimento *"
                            name="supply_date"
                            type="datetime-local"
                            value={formData.supply_date}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!validationErrors.supply_date}
                            helperText={validationErrors.supply_date}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Kilometragem Atual *"
                            name="odometer_reading"
                            type="number"
                            value={formData.odometer_reading}
                            onChange={handleChange}
                            fullWidth
                            error={!!validationErrors.odometer_reading}
                            helperText={validationErrors.odometer_reading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Tipo de Combustível *"
                            name="fuel_type"
                            value={fuelTypeLabel}
                            fullWidth
                            disabled
                            helperText="O tipo de combustível é definido pelo veículo."
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Quantidade (Litros/kWh) *"
                            name="quantity_liters"
                            type="number"
                            value={formData.quantity_liters}
                            onChange={handleChange}
                            fullWidth
                            InputProps={{ inputProps: { step: "0.01" } }}
                            error={!!validationErrors.quantity_liters}
                            helperText={validationErrors.quantity_liters}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Preço por Litro *"
                            name="price_per_unit"
                            type="number"
                            value={formData.price_per_unit}
                            onChange={handleChange}
                            fullWidth
                            InputProps={{ inputProps: { step: "0.001" } }}
                            error={!!validationErrors.price_per_unit}
                            helperText={validationErrors.price_per_unit}
                            disabled={useDefaultPrice}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={<Checkbox checked={useDefaultPrice} onChange={handleUseDefaultPrice} />}
                            label="Usar posto e preço padrão do litro"
                        />
                        {useDefaultPrice && (
                            <>
                                <TextField
                                    label="Preço padrão do litro"
                                    type="number"
                                    value={fuelPrices[formData.fuel_type] || ''}
                                    fullWidth
                                    InputProps={{ inputProps: { step: "0.001" }, readOnly: true }}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    label="Posto padrão"
                                    value={tenantSettings?.default_station_name || ''}
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                />
                            </>
                        )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Nome do Posto"
                            name="gas_station_name"
                            value={formData.gas_station_name || ''}
                            onChange={handleChange}
                            fullWidth
                            disabled={useDefaultPrice}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Número da Nota Fiscal"
                            name="invoice_number"
                            value={formData.invoice_number || ''}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Motorista"
                            name="driver_id"
                            value={formData.driver_id || ''}
                            onChange={handleSelectChange}
                            fullWidth
                        >
                            <MenuItem value=""><em>{drivers.length === 0 ? 'Nenhum motorista cadastrado' : 'Selecione um motorista'}</em></MenuItem>
                            {drivers.map(driver => (
                                <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>
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
                            onClick={() => navigate('/supplies')}
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Atualizar Registro' : 'Salvar Registro')}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default SupplyForm;

