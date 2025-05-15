import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Button, Paper, TableContainer, Table, TableHead, TableBody, 
    TableRow, TableCell, IconButton, CircularProgress, Alert, TextField, 
    MenuItem, Grid, Tooltip, TablePagination, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Container, InputAdornment 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Supply, FuelCategoryType, fuelTypeOptions } from '../types/supply';
import { Vehicle } from '../types/vehicle';

const SuppliesPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtros
    const [filterVehicleId, setFilterVehicleId] = useState<string>('');
    const [filterFuelType, setFilterFuelType] = useState<FuelCategoryType | ''>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    // Deleção
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [supplyToDelete, setSupplyToDelete] = useState<Supply | null>(null);

    const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ default_station_name: '', default_price_per_liter: '' });
    const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

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
            setVehicles(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar veículos:', err);
        }
    }, [user]);

    const fetchSupplies = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('supplies')
                .select(`
                    *,
                    vehicles (
                        id,
                        plate,
                        model
                    )
                `)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('supply_date', { ascending: false });

            if (filterVehicleId) {
                query = query.eq('vehicle_id', filterVehicleId);
            }
            if (filterFuelType) {
                query = query.eq('fuel_type', filterFuelType);
            }
            if (filterStartDate) {
                query = query.gte('supply_date', filterStartDate);
            }
            if (filterEndDate) {
                query = query.lte('supply_date', filterEndDate);
            }

            const { data, error } = await query.range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

            if (error) throw error;
            const formattedData = data?.map(s => ({
                ...s,
                vehicles: Array.isArray(s.vehicles) ? s.vehicles[0] : s.vehicles 
            })) || [];
            setSupplies(formattedData as Supply[]);

        } catch (err: any) {
            console.error('Erro ao buscar abastecimentos:', err);
            setError('Falha ao carregar abastecimentos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [user, page, rowsPerPage, filterVehicleId, filterFuelType, filterStartDate, filterEndDate]);

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

    useEffect(() => {
        fetchVehicles();
        fetchSupplies();
        fetchFuelPrices();
    }, [fetchVehicles, fetchSupplies, fetchFuelPrices]);

    const handleApplyFilters = () => {
        setPage(0);
        fetchSupplies();
    };

    const handleClearFilters = () => {
        setFilterVehicleId('');
        setFilterFuelType('');
        setFilterStartDate('');
        setFilterEndDate('');
        setPage(0);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleClickOpenDeleteDialog = (supply: Supply) => {
        setSupplyToDelete(supply);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setSupplyToDelete(null);
    };

    const handleDeleteSupply = async () => {
        if (!supplyToDelete || !user || !user.user_metadata?.tenant_id) return;
        try {
            const { error } = await supabase
                .from('supplies')
                .delete()
                .eq('id', supplyToDelete.id)
                .eq('tenant_id', user.user_metadata.tenant_id);
            if (error) throw error;
            setSupplies(supplies.filter(s => s.id !== supplyToDelete.id));
            handleCloseDeleteDialog();
        } catch (err: any) {
            console.error('Erro ao deletar abastecimento:', err);
            setError('Falha ao deletar abastecimento. Tente novamente.');
            handleCloseDeleteDialog();
        }
    };

    const handleOpenSettingsDialog = async () => {
        // Buscar nome do posto padrão
        if (user?.user_metadata?.tenant_id) {
            const { data } = await supabase
                .from('tenant_settings')
                .select('default_station_name')
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();
            setSettingsForm({
                default_station_name: data?.default_station_name || '',
                default_price_per_liter: ''
            });
            // Buscar preços dos combustíveis
            const { data: prices } = await supabase
                .from('tenant_fuel_prices')
                .select('fuel_type, price_per_liter')
                .eq('tenant_id', user.user_metadata.tenant_id);
            const pricesObj: { [key: string]: string } = {};
            prices?.forEach((row: any) => {
                pricesObj[row.fuel_type] = row.price_per_liter;
            });
            setFuelPrices(pricesObj);
        }
        setOpenSettingsDialog(true);
    };

    const handleCloseSettingsDialog = () => {
        setOpenSettingsDialog(false);
        setSettingsMessage(null);
    };

    const handleSettingsFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettingsForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFuelPriceChange = (fuelType: string, value: string) => {
        setFuelPrices(prev => ({ ...prev, [fuelType]: value }));
    };

    const handleSaveSettings = async () => {
        setSettingsMessage(null);
        try {
            // Salva ou atualiza o nome do posto padrão
            const { error: errorSettings } = await supabase
                .from('tenant_settings')
                .upsert({
                    tenant_id: user?.user_metadata?.tenant_id,
                    default_station_name: settingsForm.default_station_name
                }, { onConflict: 'tenant_id' });
            if (errorSettings) throw errorSettings;
            // Salva ou atualiza os preços dos combustíveis
            for (const fuelType of fuelTypeOptions) {
                const price = fuelPrices[fuelType.value];
                if (price && price !== '') {
                    await supabase
                        .from('tenant_fuel_prices')
                        .upsert({
                            tenant_id: user?.user_metadata?.tenant_id,
                            fuel_type: fuelType.value,
                            price_per_liter: price
                        }, { onConflict: 'tenant_id,fuel_type' });
                }
            }
            setSettingsMessage('Configuração salva com sucesso!');
            setTimeout(() => {
                setOpenSettingsDialog(false);
                setSettingsMessage(null);
            }, 800);
        } catch (err: any) {
            setSettingsMessage('Erro ao salvar configuração.');
        }
    };

    const filteredSupplies = supplies.filter(supply => {
        const searchLower = searchTerm.toLowerCase();
        return (
            supply.vehicles?.plate?.toLowerCase().includes(searchLower) ||
            supply.vehicles?.model?.toLowerCase().includes(searchLower) ||
            supply.fuel_type.toLowerCase().includes(searchLower)
        );
    });

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    Abastecimentos
                </Typography>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleOpenSettingsDialog}
                    >
                        Cadastrar Posto Padrão
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/supplies/new')}
                    >
                        Novo Abastecimento
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Box p={2}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar por placa, modelo ou tipo de combustível..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </Paper>

            <Paper sx={{ p: 3, margin: 'auto', overflow: 'hidden' }}>
                <Typography variant="h4" gutterBottom component="div">
                    Gestão de Abastecimentos
                </Typography>

                <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                    <Typography variant="h6" gutterBottom>Filtros</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                select
                                label="Veículo"
                                value={filterVehicleId}
                                onChange={(e) => setFilterVehicleId(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                            >
                                <MenuItem value=""><em>Todos os Veículos</em></MenuItem>
                                {vehicles.map((vehicle) => (
                                    <MenuItem key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plate} - {vehicle.model}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                select
                                label="Tipo de Combustível"
                                value={filterFuelType}
                                onChange={(e) => setFilterFuelType(e.target.value as FuelCategoryType | '')}
                                fullWidth
                                variant="outlined"
                                size="small"
                            >
                                <MenuItem value=""><em>Todos os Tipos</em></MenuItem>
                                {fuelTypeOptions.map(option => (
                                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                label="Data Abastec. Início"
                                type="date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                label="Data Abastec. Fim"
                                type="date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={2} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} size="medium" fullWidth>Aplicar</Button>
                            <Button variant="outlined" onClick={handleClearFilters} size="medium" fullWidth>Limpar</Button>
                        </Grid>
                    </Grid>
                </Box>
                
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/supplies/new"
                    sx={{ mb: 2 }}
                >
                    Registrar Novo Abastecimento
                </Button>

                {filteredSupplies.length === 0 && !loading ? (
                    <Alert severity="info">Nenhum abastecimento encontrado com os filtros aplicados ou nenhum abastecimento cadastrado.</Alert>
                ) : (
                    <TableContainer component={Paper} elevation={3}>
                        <Table sx={{ minWidth: 650 }} aria-label="tabela de abastecimentos">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Veículo</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Kilometragem Atual (km)</TableCell>
                                    <TableCell>Combustível</TableCell>
                                    <TableCell align="right">Qtd.</TableCell>
                                    <TableCell align="right">Preço/Un.</TableCell>
                                    <TableCell align="right">Custo Total</TableCell>
                                    <TableCell>Posto</TableCell>
                                    <TableCell align="center">Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSupplies.map((supply) => (
                                    <TableRow key={supply.id}>
                                        <TableCell>{supply.vehicles?.plate || 'N/A'} ({supply.vehicles?.model || 'N/A'})</TableCell>
                                        <TableCell>{new Date(supply.supply_date).toLocaleString('pt-BR')}</TableCell>
                                        <TableCell>{supply.odometer_reading}</TableCell>
                                        <TableCell>{supply.fuel_type.charAt(0).toUpperCase() + supply.fuel_type.slice(1)}</TableCell>
                                        <TableCell align="right">{Number(supply.quantity_liters).toFixed(2)}</TableCell>
                                        <TableCell align="right">R$ {Number(supply.price_per_unit).toFixed(3)}</TableCell>
                                        <TableCell align="right">R$ {Number(supply.total_cost).toFixed(2)}</TableCell>
                                        <TableCell>{supply.gas_station_name || 'N/A'}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver Detalhes">
                                                <IconButton onClick={() => navigate(`/supplies/view/${supply.id}`)} color="info">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Editar">
                                                <IconButton onClick={() => navigate(`/supplies/edit/${supply.id}`)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Excluir">
                                                <IconButton onClick={() => handleClickOpenDeleteDialog(supply)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={-1} // TODO: Implementar contagem total para paginação correta
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Linhas por página:"
                            labelDisplayedRows={({ from, to, count }) => 
                                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                            }
                        />
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir o registro de abastecimento do veículo {supplyToDelete?.vehicles?.plate} de {supplyToDelete?.supply_date ? new Date(supplyToDelete.supply_date).toLocaleDateString('pt-BR') : ''}?
                        Esta ação não poderá ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                    <Button onClick={handleDeleteSupply} color="error" autoFocus>Excluir</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openSettingsDialog} onClose={handleCloseSettingsDialog}>
                <DialogTitle>Cadastrar/Editar Posto Padrão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        O posto padrão e os preços por litro são usados para facilitar o cadastro de abastecimentos mensais ou contratos fixos. Ao marcar essa opção no formulário de abastecimento, os campos serão preenchidos automaticamente com esses valores.
                    </DialogContentText>
                    <TextField
                        margin="dense"
                        label="Nome do Posto Padrão"
                        name="default_station_name"
                        value={settingsForm.default_station_name}
                        onChange={handleSettingsFormChange}
                        fullWidth
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>Preços por Litro (por tipo de combustível):</Typography>
                        <Grid container spacing={2}>
                            {fuelTypeOptions.map(option => (
                                <Grid item xs={12} sm={6} key={option.value}>
                                    <TextField
                                        margin="dense"
                                        label={option.label}
                                        type="number"
                                        value={fuelPrices[option.value] || ''}
                                        onChange={e => handleFuelPriceChange(option.value, e.target.value)}
                                        fullWidth
                                        InputProps={{ inputProps: { step: "0.001" } }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                    {settingsMessage && <Alert severity={settingsMessage.includes('sucesso') ? 'success' : 'error'} sx={{ mt: 2 }}>{settingsMessage}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSettingsDialog}>Cancelar</Button>
                    <Button onClick={handleSaveSettings} variant="contained">Salvar</Button>
                    <Button color="error" onClick={async () => {
                        await supabase.from('tenant_settings').delete().eq('tenant_id', user?.user_metadata?.tenant_id);
                        await supabase.from('tenant_fuel_prices').delete().eq('tenant_id', user?.user_metadata?.tenant_id);
                        setSettingsForm({ default_station_name: '', default_price_per_liter: '' });
                        setFuelPrices({});
                        setOpenSettingsDialog(false);
                    }}>Apagar Posto Padrão</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SuppliesPage;

