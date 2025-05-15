import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, TableContainer, Table, TableHead, TableBody,
    TableRow, TableCell, IconButton, CircularProgress, Alert, TextField,
    MenuItem, Grid, Tooltip, TablePagination, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import { supabase } from '../services/supabase'; // Adjusted path
import { useAuth } from '../contexts/AuthContext'; // Adjusted path
import { DocumentMetadata, DocumentEntityType, KnownDocumentType, DocumentStatus } from '../types/document'; // Adjusted path
import { Vehicle } from '../types/vehicle'; // Adjusted path
import { Driver } from '../types/driver'; // Adjusted path

// Helper function to determine document status
const getDocumentStatus = (expirationDate?: string | null): DocumentStatus => {
    if (!expirationDate) return 'não_aplicável';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate + 'T00:00:00'); // Ensure correct date parsing
    const thirtyDaysFromNow = new Date(today.valueOf() + 30 * 24 * 60 * 60 * 1000);

    if (expiry < today) return 'vencido';
    if (expiry <= thirtyDaysFromNow) return 'próximo_vencimento';
    return 'válido';
};

const DocumentsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    // Filtros
    const [filterDocumentName, setFilterDocumentName] = useState<string>('');
    const [filterDocumentType, setFilterDocumentType] = useState<KnownDocumentType | ''>('');
    const [filterEntityType, setFilterEntityType] = useState<DocumentEntityType | ''>('');
    const [filterEntityId, setFilterEntityId] = useState<string>(''); // Para buscar por ID específico
    const [filterEntityName, setFilterEntityName] = useState<string>(''); // Para exibir nome no filtro
    const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
    
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // Deleção
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [documentToDelete, setDocumentToDelete] = useState<DocumentMetadata | null>(null);

    const documentTypeOptions: KnownDocumentType[] = ['CNH', 'CRLV', 'Apólice de Seguro', 'Certificado de Inspeção Veicular', 'Certificado de Curso', 'Comprovante de Endereço', 'RG', 'CPF', 'Outro'];
    const entityTypeOptions: DocumentEntityType[] = ['vehicle', 'driver'];
    const documentStatusOptions: DocumentStatus[] = ['válido', 'próximo_vencimento', 'vencido', 'não_aplicável'];

    const fetchAssociatedEntities = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const [vehicleRes, driverRes] = await Promise.all([
                supabase.from('vehicles').select('*').eq('tenant_id', user.user_metadata.tenant_id),
                supabase.from('drivers').select('*').eq('tenant_id', user.user_metadata.tenant_id)
            ]);
            if (vehicleRes.error) throw vehicleRes.error;
            if (driverRes.error) throw driverRes.error;
            setVehicles(vehicleRes.data as Vehicle[] || []);
            setDrivers(driverRes.data as Driver[] || []);
        } catch (err) {
            console.error('Erro ao buscar entidades associadas:', err);
            // Não definir erro principal aqui para não sobrescrever erro de documentos
        }
    }, [user]);

    const fetchDocuments = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('documents')
                .select(`
                    *,
                    vehicles!vehicle_id(plate, model),
                    drivers!driver_id(name, cpf)
                `, { count: 'exact' })
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('created_at', { ascending: false });

            if (filterDocumentName) query = query.ilike('document_name', `%${filterDocumentName}%`);
            if (filterDocumentType) query = query.eq('document_type', filterDocumentType);
            if (filterEntityType) query = query.eq('entity_type', filterEntityType);
            if (filterEntityId && filterEntityType) {
                if (filterEntityType === 'vehicle') {
                    query = query.eq('vehicle_id', filterEntityId);
                } else {
                    query = query.eq('driver_id', filterEntityId);
                }
            }

            const { data, error, count } = await query.range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

            if (error) throw error;
            
            let processedData = (data || []).map(doc => {
                const status_validity = getDocumentStatus(doc.expiration_date);
                let entityDisplay = '';
                if (doc.entity_type === 'vehicle' && doc.vehicles) {
                    entityDisplay = `${doc.vehicles.plate} (${doc.vehicles.model || 'N/A'})`;
                } else if (doc.entity_type === 'driver' && doc.drivers) {
                    entityDisplay = `${doc.drivers.name} (${doc.drivers.cpf || 'N/A'})`;
                }
                return { ...doc, status_validity, entity_display: entityDisplay };
            });

            if (filterStatus) {
                processedData = processedData.filter(doc => doc.status_validity === filterStatus);
            }

            setDocuments(processedData);
            setTotalRows(count || 0);

        } catch (err: any) {
            console.error('Erro ao buscar documentos:', err);
            setError('Falha ao carregar documentos. Verifique se a tabela "documents" e suas colunas (incluindo as de relacionamento com vehicles e drivers) foram criadas corretamente no Supabase e se as políticas RLS permitem a leitura.');
        } finally {
            setLoading(false);
        }
    }, [user, page, rowsPerPage, filterDocumentName, filterDocumentType, filterEntityType, filterEntityId, filterStatus]);

    useEffect(() => {
        fetchAssociatedEntities();
        fetchDocuments();
    }, [fetchDocuments, fetchAssociatedEntities]);

    const handleApplyFilters = () => {
        setPage(0);
        fetchDocuments();
    };

    const handleClearFilters = () => {
        setFilterDocumentName('');
        setFilterDocumentType('');
        setFilterEntityType('');
        setFilterEntityId('');
        setFilterEntityName('');
        setFilterStatus('');
        setPage(0);
        // fetchDocuments(); // Descomentar se quiser recarregar imediatamente
    };

    const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleClickOpenDeleteDialog = (doc: DocumentMetadata) => {
        setDocumentToDelete(doc);
        setOpenDeleteDialog(true);
    };
    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setDocumentToDelete(null);
    };

    const handleDeleteDocument = async () => {
        if (!documentToDelete || !user || !user.user_metadata?.tenant_id) return;
        try {
            // Primeiro, deletar o arquivo do Supabase Storage se existir
            if (documentToDelete.file_url) {
                const filePath = new URL(documentToDelete.file_url).pathname.split('/render/storage/v1/object/public/')[1];
                if (filePath) {
                    const { error: storageError } = await supabase.storage.from('document-files').remove([filePath]);
                    if (storageError) console.warn('Aviso: Falha ao deletar arquivo do storage:', storageError.message);
                }
            }
            // Depois, deletar o metadado do banco
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentToDelete.id)
                .eq('tenant_id', user.user_metadata.tenant_id);
            if (error) throw error;
            setDocuments(documents.filter(d => d.id !== documentToDelete.id));
            setTotalRows(prev => prev -1);
            handleCloseDeleteDialog();
        } catch (err: any) {
            console.error('Erro ao deletar documento:', err);
            setError('Falha ao deletar documento. Tente novamente.');
            handleCloseDeleteDialog();
        }
    };
    
    const handleDownloadFile = async (fileUrl?: string | null, fileName?: string | null) => {
        if (!fileUrl) {
            setError('URL do arquivo não encontrada.');
            return;
        }
        try {
            // Supabase Storage URLs for public files are direct download links.
            // For private files, you'd need to create a signed URL.
            // Assuming public for now based on typical 'file_url' usage.
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName || 'documento';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err: any) {
            console.error('Erro ao baixar arquivo:', err);
            setError(`Falha ao baixar o arquivo: ${err.message}`);
        }
    };

    if (loading && documents.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 3, margin: 'auto', overflow: 'hidden' }}>
            <Typography variant="h4" gutterBottom component="div">Gerenciamento de Documentos</Typography>

            <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: '4px' }}>
                <Typography variant="h6" gutterBottom>Filtros</Typography>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField label="Nome do Documento" value={filterDocumentName} onChange={(e) => setFilterDocumentName(e.target.value)} fullWidth variant="outlined" size="small" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField select label="Tipo de Documento" value={filterDocumentType} onChange={(e) => setFilterDocumentType(e.target.value as KnownDocumentType | '')} fullWidth variant="outlined" size="small">
                            <MenuItem value=""><em>Todos</em></MenuItem>
                            {documentTypeOptions.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField select label="Tipo de Entidade" value={filterEntityType} onChange={(e) => { setFilterEntityType(e.target.value as DocumentEntityType | ''); setFilterEntityId(''); setFilterEntityName(''); }} fullWidth variant="outlined" size="small">
                            <MenuItem value=""><em>Todas</em></MenuItem>
                            {entityTypeOptions.map(type => <MenuItem key={type} value={type}>{type === 'vehicle' ? 'Veículo' : 'Motorista'}</MenuItem>)}
                        </TextField>
                    </Grid>
                    {filterEntityType && (
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField select label={`Selecionar ${filterEntityType === 'vehicle' ? 'Veículo' : 'Motorista'}`} value={filterEntityId} onChange={(e) => { 
                                setFilterEntityId(e.target.value);
                                const selected = filterEntityType === 'vehicle' ? vehicles.find(v => v.id === e.target.value) : drivers.find(d => d.id === e.target.value);
                                setFilterEntityName(selected ? (filterEntityType === 'vehicle' ? `${(selected as Vehicle).plate}` : `${(selected as Driver).name}`) : '');
                            }} fullWidth variant="outlined" size="small" disabled={String(filterEntityType) === ''}>
                                <MenuItem value=""><em>Todos</em></MenuItem>
                                {(String(filterEntityType) === '' ? [...vehicles, ...drivers] : (filterEntityType === 'vehicle' ? vehicles : drivers)).map(entity => (
                                    <MenuItem key={entity.id} value={entity.id}>
                                        {filterEntityType === 'vehicle' ? (entity as Vehicle).plate : (entity as Driver).name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField select label="Status Validade" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as DocumentStatus | '')} fullWidth variant="outlined" size="small">
                            <MenuItem value=""><em>Todos</em></MenuItem>
                            {documentStatusOptions.map(status => <MenuItem key={status} value={status}>{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={12} md={filterEntityType ? 12 : 2} sx={{ display: 'flex', gap: 1, mt: filterEntityType ? 1 : 0 }}>
                        <Button variant="contained" onClick={handleApplyFilters} startIcon={<FilterListIcon />} size="medium" fullWidth>Aplicar</Button>
                        <Button variant="outlined" onClick={handleClearFilters} size="medium" fullWidth>Limpar</Button>
                    </Grid>
                </Grid>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Button variant="contained" color="primary" startIcon={<AddIcon />} component={RouterLink} to="/documents/new" sx={{ mb: 2 }}>Adicionar Novo Documento</Button>

            {loading && documents.length > 0 && <CircularProgress sx={{ display: 'block', margin: '20px auto' }}/>}
            
            {documents.length === 0 && !loading ? (
                <Alert severity="info">Nenhum documento encontrado.</Alert>
            ) : (
                <TableContainer component={Paper} elevation={3}>
                    <Table sx={{ minWidth: 650 }} aria-label="tabela de documentos">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome do Documento</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Entidade Associada</TableCell>
                                <TableCell>Validade</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id} hover>
                                    <TableCell>{doc.document_name}</TableCell>
                                    <TableCell>{doc.document_type === 'Outro' ? doc.custom_document_type_description || 'Outro' : doc.document_type}</TableCell>
                                    <TableCell>{(doc as any).entity_display || 'N/A'}</TableCell>
                                    <TableCell>{doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={doc.status_validity?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            size="small"
                                            color={
                                                doc.status_validity === 'vencido' ? 'error' :
                                                doc.status_validity === 'próximo_vencimento' ? 'warning' :
                                                doc.status_validity === 'válido' ? 'success' : 'default'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {doc.file_url && (
                                            <Tooltip title="Baixar Arquivo">
                                                <IconButton onClick={() => handleDownloadFile(doc.file_url, doc.file_name)} color="secondary">
                                                    <FileDownloadIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Ver Detalhes">
                                            <IconButton onClick={() => navigate(`/documents/view/${doc.id}`)} color="info">
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                            <IconButton onClick={() => navigate(`/documents/edit/${doc.id}`)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton onClick={() => handleClickOpenDeleteDialog(doc)} color="error">
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
                        count={totalRows}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Linhas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </TableContainer>
            )}

            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tem certeza que deseja excluir o documento "{documentToDelete?.document_name}"?
                        Esta ação também removerá o arquivo associado do armazenamento, se houver, e não poderá ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                    <Button onClick={handleDeleteDocument} color="error" autoFocus>Excluir</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default DocumentsPage;

