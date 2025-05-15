import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Driver, DriverStatusType, CnhCategoryType } from '../types/driver';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';

const DriversPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filtros
    const [filterName, setFilterName] = useState<string>('');
    const [filterCpf, setFilterCpf] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<DriverStatusType | ''>('');
    const [filterCnhCategory, setFilterCnhCategory] = useState<CnhCategoryType | ''>('');

    // Deleção
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

    const driverStatusOptions: DriverStatusType[] = ['ativo', 'inativo', 'férias', 'afastado', 'desligado'];
    const cnhCategoryOptions: CnhCategoryType[] = ['A', 'B', 'AB', 'C', 'D', 'E', 'ACC'];

    const [signedUrls, setSignedUrls] = useState<{ [driverId: string]: string | null }>({});

    const fetchDrivers = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('drivers')
                .select('*') // Selecionar todos os campos por enquanto, ajustar conforme necessário
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('name', { ascending: true });

            if (filterName) {
                query = query.ilike('name', `%${filterName}%`);
            }
            if (filterCpf) {
                query = query.ilike('cpf', `%${filterCpf}%`);
            }
            if (filterStatus) {
                query = query.eq('status', filterStatus);
            }
            if (filterCnhCategory) {
                query = query.eq('cnh_category', filterCnhCategory);
            }

            const { data, error, count } = await query.range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

            if (error) throw error;
            setDrivers(data || []);
            // TODO: Setar a contagem total para a paginação (count pode vir do Supabase com { count: 'exact' })

        } catch (err: any) {
            console.error('Erro ao buscar motoristas:', err);
            setError('Falha ao carregar motoristas. Verifique se a tabela "drivers" foi criada corretamente no Supabase e se as políticas RLS permitem a leitura.');
        } finally {
            setLoading(false);
        }
    }, [user, page, rowsPerPage, filterName, filterCpf, filterStatus, filterCnhCategory]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers, location.pathname]);

    useEffect(() => {
        const fetchAllSignedUrls = async () => {
            const urls: { [driverId: string]: string | null } = {};
            await Promise.all(drivers.map(async (driver) => {
                urls[String(driver.id)] = driver.profile_picture_url ? await getSignedUrl(driver.profile_picture_url) : null;
            }));
            setSignedUrls(urls);
        };
        if (drivers.length > 0) fetchAllSignedUrls();
    }, [drivers]);

    const handleApplyFilters = () => {
        setPage(0);
        fetchDrivers();
    };

    const handleClearFilters = () => {
        setFilterName('');
        setFilterCpf('');
        setFilterStatus('');
        setFilterCnhCategory('');
        setPage(0);
        // fetchDrivers(); // Descomentar se quiser recarregar imediatamente após limpar
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleClickOpenDeleteDialog = (driver: Driver) => {
        setDriverToDelete(driver);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setDriverToDelete(null);
    };

    const handleDeleteDriver = async () => {
        if (!driverToDelete || !user || !user.user_metadata?.tenant_id) return;
        try {
            const { error } = await supabase
                .from('drivers')
                .delete()
                .eq('id', driverToDelete.id)
                .eq('tenant_id', user.user_metadata.tenant_id);
            if (error) throw error;
            setDrivers(drivers.filter(d => d.id !== driverToDelete.id));
            handleCloseDeleteDialog();
        } catch (err: any) {
            console.error('Erro ao deletar motorista:', err);
            setError('Falha ao deletar motorista. Tente novamente.');
            handleCloseDeleteDialog();
        }
    };

    const getSignedUrl = async (profile_picture_url: string | null) => {
        if (!profile_picture_url) return null;
        try {
            const idx = profile_picture_url.indexOf('/driver_photos/');
            if (idx === -1) return null;
            const filePath = profile_picture_url.substring(idx + 15);
            const { data, error } = await supabase.storage
                .from('driver_photos')
                .createSignedUrl(filePath, 60 * 5);
            if (error) return null;
            return data?.signedUrl || null;
        } catch {
            return null;
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 4, margin: 'auto', overflow: 'hidden', maxWidth: 1400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ color: 'primary.main' }}>
                    Gestão de Motoristas
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/drivers/new"
                    sx={{ fontWeight: 'bold', fontSize: 16, px: 3, py: 1 }}
                >
                    Novo Motorista
                </Button>
            </Box>

            <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: '8px', bgcolor: 'grey.50' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Nome do Motorista"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            label="CPF"
                            value={filterCpf}
                            onChange={(e) => setFilterCpf(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            label="Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as DriverStatusType | '')}
                            fullWidth
                            variant="outlined"
                            size="small"
                        >
                            <MenuItem value=""><em>Todos</em></MenuItem>
                            {driverStatusOptions.map(status => (
                                <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            select
                            label="Categoria CNH"
                            value={filterCnhCategory}
                            onChange={(e) => setFilterCnhCategory(e.target.value as CnhCategoryType | '')}
                            fullWidth
                            variant="outlined"
                            size="small"
                        >
                            <MenuItem value=""><em>Todas</em></MenuItem>
                            {cnhCategoryOptions.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} size="medium" fullWidth>Aplicar</Button>
                        <Button variant="outlined" onClick={handleClearFilters} size="medium" fullWidth>Limpar</Button>
                    </Grid>
                </Grid>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {drivers.length === 0 && !loading ? (
                <Alert severity="info">Nenhum motorista encontrado com os filtros aplicados ou nenhum motorista cadastrado.</Alert>
            ) : (
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
                    <Table sx={{ minWidth: 800 }} aria-label="tabela de motoristas">
                        <TableHead>
                            <TableRow>
                                <TableCell>Foto</TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>CPF</TableCell>
                                <TableCell>CNH (Número - Cat.)</TableCell>
                                <TableCell>Validade CNH</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Telefone</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {drivers.map((driver) => (
                                <TableRow key={driver.id} hover>
                                    <TableCell>
                                        <Avatar
                                            src={signedUrls[String(driver.id)] || ''}
                                            alt={driver.name}
                                            sx={{ width: 40, height: 40, bgcolor: 'primary.light', border: '2px solid', borderColor: 'primary.main' }}
                                        >
                                            {!signedUrls[String(driver.id)] && <PersonIcon fontSize="large" />}
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>{driver.name}</TableCell>
                                    <TableCell>{driver.cpf}</TableCell>
                                    <TableCell>{driver.cnh_number} - {driver.cnh_category}</TableCell>
                                    <TableCell>{new Date(driver.cnh_expiration_date + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}</TableCell>
                                    <TableCell>{driver.phone}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalhes">
                                            <IconButton onClick={() => navigate(`/drivers/view/${driver.id}`)} color="info">
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => navigate(`/drivers/edit/${driver.id}`)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleClickOpenDeleteDialog(driver)} color="error">
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
                        count={-1}
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
                        Tem certeza que deseja excluir o motorista {driverToDelete?.name}?
                        Esta ação não poderá ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                    <Button onClick={handleDeleteDriver} color="error" autoFocus>Excluir</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default DriversPage;

