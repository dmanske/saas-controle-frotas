import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Paper, CircularProgress, Alert, Grid, Button, Divider, Chip,
    TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Tooltip, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add'; // For adding documents
import FileDownloadIcon from '@mui/icons-material/FileDownload'; // For downloading documents
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Vehicle } from '../types/vehicle';
import { Supply } from '../types/supply';
import { DocumentMetadata, DocumentStatus } from '../types/document';

// Helper function to determine document status (can be shared or re-imported)
const getDocumentStatus = (expirationDate?: string | null): DocumentStatus => {
    if (!expirationDate) return 'não_aplicável';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate + 'T00:00:00');
    const thirtyDaysFromNow = new Date(today.valueOf() + 30 * 24 * 60 * 60 * 1000);

    if (expiry < today) return 'vencido';
    if (expiry <= thirtyDaysFromNow) return 'próximo_vencimento';
    return 'válido';
};

const VehicleDetailPage: React.FC = () => {
    const { user } = useAuth();
    const { id: vehicleId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]); // State for documents
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVehicleDetails = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !vehicleId) return;
        try {
            const [vehicleRes, documentsRes] = await Promise.all([
                supabase
                    .from("vehicles")
                    .select("*")
                    .eq("id", vehicleId)
                    .eq("tenant_id", user.user_metadata.tenant_id)
                    .single(),
                supabase
                    .from("documents")
                    .select(`
                        *,
                        vehicles!vehicle_id(plate, model),
                        drivers!driver_id(name, cpf)
                    `)
                    .eq("vehicle_id", vehicleId)
                    .eq("tenant_id", user.user_metadata.tenant_id)
                    .order("created_at", { ascending: false })
            ]);

            if (vehicleRes.error) throw vehicleRes.error;
            if (documentsRes.error) throw documentsRes.error;

            if (vehicleRes.data) {
                setVehicle(vehicleRes.data as Vehicle);
            } else {
                setError("Veículo não encontrado.");
            }

            const processedDocuments = (documentsRes.data || []).map(doc => ({
                ...doc,
                status_validity: getDocumentStatus(doc.expiration_date)
            }));
            setDocuments(processedDocuments);

        } catch (err: any) {
            console.error("Erro ao buscar detalhes do veículo:", err);
            setError("Falha ao carregar detalhes do veículo.");
            setVehicle(null);
        }
    }, [user, vehicleId]);

    const fetchVehicleSupplies = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !vehicleId) return;
        try {
            const { data, error } = await supabase
                .from('supplies')
                .select('id, supply_date, odometer_reading, fuel_type, quantity_liters, total_cost')
                .eq('vehicle_id', vehicleId)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .order('supply_date', { ascending: false })
                .limit(5); // Show last 5 supplies
            if (error) throw error;
            setSupplies((data || []) as Supply[]);
        } catch (err: any) {
            console.error('Erro ao buscar abastecimentos do veículo:', err);
        }
    }, [user, vehicleId]);

    const fetchVehicleDocuments = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !vehicleId) return;
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('tenant_id', user.user_metadata.tenant_id)
                .eq('entity_type', 'vehicle')
                .eq('entity_id', vehicleId)
                .order('created_at', { ascending: false })
                .limit(5); // Show last 5 documents
            if (error) throw error;
            setDocuments((data || []).map(doc => ({ ...doc, status_validity: getDocumentStatus(doc.expiration_date) })));
        } catch (err: any) {
            console.error('Erro ao buscar documentos do veículo:', err);
        }
    }, [user, vehicleId]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchVehicleDetails(), fetchVehicleSupplies(), fetchVehicleDocuments()])
            .catch(() => { /* Errors handled internally */ })
            .finally(() => setLoading(false));
    }, [fetchVehicleDetails, fetchVehicleSupplies, fetchVehicleDocuments]);

    const handleDownloadFile = async (fileUrl?: string | null, fileName?: string | null) => {
        if (!fileUrl) {
            setError('URL do arquivo não encontrada.');
            return;
        }
        try {
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

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>{label}</Typography>
            <Typography variant="body1">{value || 'N/A'}</Typography>
        </Grid>
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    if (error && !vehicle) return <Alert severity="error">{error}</Alert>;
    if (!vehicle) return <Alert severity="info">Detalhes do veículo não encontrados.</Alert>;

    return (
        <Paper sx={{ p: 3, margin: 'auto', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="div">
                    Detalhes do Veículo: {vehicle.plate}
                </Typography>
                <Box>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/vehicles')} sx={{ mr: 1 }}>
                        Voltar
                    </Button>
                    <Button variant="contained" startIcon={<EditIcon />} component={RouterLink} to={`/vehicles/edit/${vehicle.id}`}>
                        Editar Veículo
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>Informações Gerais</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <DetailItem label="Placa" value={vehicle.plate} />
                <DetailItem label="Marca" value={vehicle.brand} />
                <DetailItem label="Modelo" value={vehicle.model} />
                <DetailItem label="Ano" value={vehicle.year} />
                <DetailItem label="Renavam" value={vehicle.renavam} />
                <DetailItem label="Chassi" value={vehicle.chassis} />
                <DetailItem label="Cor" value={vehicle.color} />
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>Notas</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{vehicle.notes || 'Nenhuma nota.'}</Typography>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }}><Chip label="Documentos Recentes" /></Divider>
            {error && <Alert severity="warning" sx={{mb:1}}>{error}</Alert>}
            <Button 
                variant="outlined" 
                size="small" 
                startIcon={<AddIcon />} 
                component={RouterLink} 
                to={`/documents/new?entityType=vehicle&entityId=${vehicle.id}&entityName=${encodeURIComponent(vehicle.plate)}`} 
                sx={{ mb: 1, mr:1 }}
            >
                Adicionar Documento
            </Button>
            <Button 
                variant="outlined" 
                size="small" 
                startIcon={<VisibilityIcon />} 
                component={RouterLink} 
                to={`/documents?entityType=vehicle&entityId=${vehicle.id}`} 
                sx={{ mb: 1 }}
            >
                Ver Todos Documentos do Veículo
            </Button>
            {documents.length > 0 ? (
                <TableContainer component={Paper} elevation={1} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Validade</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell>{doc.document_name}</TableCell>
                                    <TableCell>{doc.document_type === 'Outro' ? doc.custom_document_type_description || 'Outro' : doc.document_type}</TableCell>
                                    <TableCell>{doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={doc.status_validity?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            size="small"
                                            color={doc.status_validity === 'vencido' ? 'error' : doc.status_validity === 'próximo_vencimento' ? 'warning' : doc.status_validity === 'válido' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {doc.file_url && (
                                            <Tooltip title="Baixar Arquivo">
                                                <IconButton onClick={() => handleDownloadFile(doc.file_url, doc.file_name)} size="small">
                                                    <FileDownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Ver Detalhes do Documento">
                                            <IconButton component={RouterLink} to={`/documents/view/${doc.id}`} size="small">
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>Nenhum documento recente para este veículo.</Alert>
            )}

            <Divider sx={{ my: 2 }}><Chip label="Abastecimentos Recentes" /></Divider>
            {supplies.length > 0 ? (
                <TableContainer component={Paper} elevation={1} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Hodômetro</TableCell>
                                <TableCell>Combustível</TableCell>
                                <TableCell align="right">Qtd.</TableCell>
                                <TableCell align="right">Custo</TableCell>
                                <TableCell align="center">Detalhes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {supplies.map((supply) => (
                                <TableRow key={supply.id}>
                                    <TableCell>{new Date(supply.supply_date).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{supply.odometer_reading}</TableCell>
                                    <TableCell>{supply.fuel_type.charAt(0).toUpperCase() + supply.fuel_type.slice(1)}</TableCell>
                                    <TableCell align="right">{Number(supply.quantity_liters).toFixed(2)}</TableCell>
                                    <TableCell align="right">R$ {Number(supply.total_cost).toFixed(2)}</TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalhes do Abastecimento">
                                            <IconButton component={RouterLink} to={`/supplies/view/${supply.id}`} size="small">
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>Nenhum abastecimento recente para este veículo.</Alert>
            )}
        </Paper>
    );
};

export default VehicleDetailPage;

