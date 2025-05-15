import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
    Box, Typography, Button, Paper, TableContainer, Table, TableHead, TableBody, 
    TableRow, TableCell, IconButton, CircularProgress, Alert, TextField, 
    MenuItem, Grid, Tooltip, TablePagination, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { Maintenance, MaintenanceStatusType, MaintenanceCategoryType } from '../types/maintenance';
import { Vehicle } from '../types/vehicle';

const MaintenancesPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filtros
    const [filterVehicleId, setFilterVehicleId] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<MaintenanceStatusType | ''>('');
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    // Deleção
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [maintenanceToDelete, setMaintenanceToDelete] = useState<Maintenance | null>(null);

    const fetchVehicles = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('tenant_id', user.user_metadata.tenant_id);
            if (error) throw error;
            setVehicles(data as Vehicle[] || []);
        } catch (err: any) {
            console.error('Erro ao buscar veículos:', err);
            // Não definir erro aqui para não sobrescrever o erro de manutenções
        }
    }, [user]);

    const fetchMaintenances = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('maintenances')
                .select(`
                    id, created_at, tenant_id, vehicle_id, maintenance_type, description, 
                    scheduled_date, completion_date, cost_parts, cost_services, total_cost, 
                    supplier_name, status, notes,
                    vehicles (id, plate, model, brand)
                `)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('scheduled_date', { ascending: false });

            if (filterVehicleId) {
                query = query.eq('vehicle_id', filterVehicleId);
            }
            if (filterStatus) {
                query = query.eq('status', filterStatus);
            }
            if (filterStartDate) {
                query = query.gte('scheduled_date', filterStartDate);
            }
            if (filterEndDate) {
                query = query.lte('scheduled_date', filterEndDate);
            }

            const { data, error, count } = await query.range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

            if (error) throw error;
            
            // Mapear para garantir que vehicle seja um objeto
            const formattedData = data?.map(m => ({
                ...m,
                vehicle: Array.isArray(m.vehicles) ? m.vehicles[0] : m.vehicles 
            })) || [];
            
            setMaintenances(formattedData as Maintenance[]);

        } catch (err: any) {
            console.error('Erro ao buscar manutenções:', err);
            setError('Falha ao carregar manutenções. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [user, page, rowsPerPage, filterVehicleId, filterStatus, filterStartDate, filterEndDate]);

    useEffect(() => {
        fetchVehicles();
        fetchMaintenances();
    }, [fetchVehicles, fetchMaintenances]);

    const handleApplyFilters = () => {
        setPage(0); // Resetar para a primeira página ao aplicar filtros
        fetchMaintenances();
    };

    const handleClearFilters = () => {
        setFilterVehicleId('');
        setFilterStatus('');
        setFilterStartDate('');
        setFilterEndDate('');
        setPage(0);
        // fetchMaintenances será chamado pelo useEffect devido à mudança de estado dos filtros
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleClickOpenDeleteDialog = (maintenance: Maintenance) => {
        setMaintenanceToDelete(maintenance);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setMaintenanceToDelete(null);
    };

    const handleDeleteMaintenance = async () => {
        if (!maintenanceToDelete || !user || !user.user_metadata?.tenant_id) return;
        try {
            const { error } = await supabase
                .from('maintenances')
                .delete()
                .eq('id', maintenanceToDelete.id)
                .eq('tenant_id', user.user_metadata.tenant_id);
            if (error) throw error;
            setMaintenances(maintenances.filter(m => m.id !== maintenanceToDelete.id));
            handleCloseDeleteDialog();
        } catch (err: any) {
            console.error('Erro ao deletar manutenção:', err);
            setError('Falha ao deletar manutenção. Tente novamente.');
            handleCloseDeleteDialog();
        }
    };

    const maintenanceStatusOptions: MaintenanceStatusType[] = ['agendada', 'em andamento', 'concluída', 'cancelada', 'pendente'];

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    // if (error) return <Alert severity="error">{error}</Alert>; // Mostrar erro abaixo dos filtros

    return (
        <Paper sx={{ p: 3, margin: 'auto', overflow: 'hidden' }}>
            <Typography variant="h4" gutterBottom component="div">
                Controle de Manutenções
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
                            label="Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as MaintenanceStatusType | '')}
                            fullWidth
                            variant="outlined"
                            size="small"
                        >
                            <MenuItem value=""><em>Todos os Status</em></MenuItem>
                            {maintenanceStatusOptions.map(status => (
                                <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            label="Data Agend. Início"
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
                            label="Data Agend. Fim"
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
                        <Button 
                            variant="contained" 
                            onClick={handleApplyFilters} 
                            startIcon={<FilterListIcon />} 
                            size="medium"
                            fullWidth
                        >
                            Aplicar
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleClearFilters} 
                            size="medium"
                            fullWidth
                        >
                            Limpar
                        </Button>
                    </Grid>
                </Grid>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/maintenances/new"
                sx={{ mb: 2 }}
            >
                Adicionar Nova Manutenção
            </Button>

            {maintenances.length === 0 && !loading ? (
                <Alert severity="info">Nenhuma manutenção encontrada com os filtros aplicados ou nenhuma manutenção cadastrada.</Alert>
            ) : (
                <TableContainer component={Paper} elevation={3}>
                    <Table sx={{ minWidth: 650 }} aria-label="tabela de manutenções">
                        <TableHead>
                            <TableRow>
                                <TableCell>Veículo</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Descrição</TableCell>
                                <TableCell>Data Agendada</TableCell>
                                <TableCell>Data Conclusão</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Custo Total</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {maintenances.map((maintenance) => (
                                <TableRow key={maintenance.id}>
                                    <TableCell>{maintenance.vehicle?.plate || 'N/A'} ({maintenance.vehicle?.model || 'N/A'})</TableCell>
                                    <TableCell>{maintenance.maintenance_type.charAt(0).toUpperCase() + maintenance.maintenance_type.slice(1)}</TableCell>
                                    <TableCell>{maintenance.description.substring(0,50)}{maintenance.description.length > 50 ? '...' : ''}</TableCell>
                                    <TableCell>{maintenance.scheduled_date ? new Date(maintenance.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                                    <TableCell>{maintenance.completion_date ? new Date(maintenance.completion_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                                    <TableCell>{maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1)}</TableCell>
                                    <TableCell align="right">R$ {Number(maintenance.total_cost).toFixed(2)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalhes">
                                            <IconButton onClick={() => navigate(`/maintenances/view/${maintenance.id}`)} color="info">
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => navigate(`/maintenances/edit/${maintenance.id}`)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleClickOpenDeleteDialog(maintenance)} color="error">
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
                        count={-1} // TODO: Implementar contagem total para paginação correta ou usar count de fetchMaintenances se for preciso
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

            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir a manutenção "{maintenanceToDelete?.description}" do veículo {maintenanceToDelete?.vehicle?.plate}?
                        Esta ação não poderá ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                    <Button onClick={handleDeleteMaintenance} color="error" autoFocus>
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default MaintenancesPage;

