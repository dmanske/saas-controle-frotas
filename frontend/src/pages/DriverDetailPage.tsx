import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { 
    Box, Typography, Paper, CircularProgress, Alert, Grid, Button, Divider, Chip, Avatar,
    TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Tooltip, IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add"; // For adding documents
import VisibilityIcon from "@mui/icons-material/Visibility"; // For viewing documents
import FileDownloadIcon from "@mui/icons-material/FileDownload"; // For downloading documents
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Driver, DriverAddress } from '../types/driver';
import { DocumentMetadata, DocumentStatus } from '../types/document';

// Helper function to determine document status (can be shared or re-imported)
const getDocumentStatus = (expirationDate?: string | null): DocumentStatus => {
    if (!expirationDate) return "não_aplicável";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate + "T00:00:00");
    const thirtyDaysFromNow = new Date(today.valueOf() + 30 * 24 * 60 * 60 * 1000);

    if (expiry < today) return "vencido";
    if (expiry <= thirtyDaysFromNow) return "próximo_vencimento";
    return "válido";
};

const DriverDetailPage: React.FC = () => {
    const { user } = useAuth();
    const { id: driverId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]); // State for documents
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [docError, setDocError] = useState<string | null>(null);

    const fetchDriverDetails = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !driverId) return;
        try {
            const [driverRes, documentsRes] = await Promise.all([
                supabase
                    .from("drivers")
                    .select("*")
                    .eq("id", driverId)
                    .eq("tenant_id", user.user_metadata.tenant_id)
                    .single(),
                supabase
                    .from("documents")
                    .select(`
                        *,
                        vehicles!vehicle_id(plate, model),
                        drivers!driver_id(name, cpf)
                    `)
                    .eq("driver_id", driverId)
                    .eq("tenant_id", user.user_metadata.tenant_id)
                    .order("created_at", { ascending: false })
            ]);

            if (driverRes.error) throw driverRes.error;
            if (documentsRes.error) throw documentsRes.error;

            if (driverRes.data) {
                setDriver(driverRes.data as Driver);
            } else {
                setError("Motorista não encontrado.");
            }

            const processedDocuments = (documentsRes.data || []).map(doc => ({
                ...doc,
                status_validity: getDocumentStatus(doc.expiration_date)
            }));
            setDocuments(processedDocuments);

        } catch (err: any) {
            console.error("Erro ao buscar detalhes do motorista:", err);
            setError("Falha ao carregar detalhes do motorista.");
            setDriver(null);
        }
    }, [user, driverId]);

    const fetchDriverDocuments = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !driverId) return;
        setDocError(null);
        try {
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .eq("tenant_id", user.user_metadata.tenant_id)
                .eq("entity_type", "driver")
                .eq("entity_id", driverId)
                .order("created_at", { ascending: false })
                .limit(5); // Show last 5 documents, for example
            if (error) throw error;
            setDocuments((data || []).map(doc => ({ ...doc, status_validity: getDocumentStatus(doc.expiration_date) })));
        } catch (err: any) {
            console.error("Erro ao buscar documentos do motorista:", err);
            setDocError("Falha ao carregar documentos do motorista.");
        }
    }, [user, driverId]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchDriverDetails(), fetchDriverDocuments()])
            .catch(() => { /* Errors handled internally */ })
            .finally(() => setLoading(false));
    }, [fetchDriverDetails, fetchDriverDocuments]);

    const handleDownloadFile = async (fileUrl?: string | null, fileName?: string | null) => {
        if (!fileUrl) {
            setDocError("URL do arquivo não encontrada.");
            return;
        }
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName || "documento";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err: any) {
            console.error("Erro ao baixar arquivo:", err);
            setDocError(`Falha ao baixar o arquivo: ${err.message}`);
        }
    };

    const DetailItem: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
        <Grid item xs={12} sm={fullWidth ? 12 : 6} md={fullWidth ? 12 : 4}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>{label}</Typography>
            <Typography variant="body1" sx={{ wordBreak: "break-word" }}>{value || "N/A"}</Typography>
        </Grid>
    );

    const AddressDisplay: React.FC<{ address: DriverAddress | null | undefined }> = ({ address }) => {
        if (!address) return <Typography variant="body1">N/A</Typography>;
        const { street, number, complement, neighborhood, city, state, cep } = address;
        let fullAddress = "";
        if (street) fullAddress += `${street}`;
        if (number) fullAddress += `, ${number}`;
        if (complement) fullAddress += ` - ${complement}`;
        if (neighborhood) fullAddress += `\n${neighborhood}`;
        if (city) fullAddress += ` - ${city}`;
        if (state) fullAddress += `/${state}`;
        if (cep) fullAddress += `\nCEP: ${cep}`;
        return <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{fullAddress || "N/A"}</Typography>;
    };

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}><CircularProgress /></Box>;
    if (error && !driver) return <Alert severity="error">{error}</Alert>;
    if (!driver) return <Alert severity="info">Detalhes do motorista não disponíveis.</Alert>;

    return (
        <Paper sx={{ p: 3, margin: "auto", overflow: "hidden" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    {driver.profile_picture_url ? (
                        <Avatar src={driver.profile_picture_url} sx={{ width: 56, height: 56, mr: 2 }} />
                    ) : (
                        <Avatar sx={{ width: 56, height: 56, mr: 2 }}><PersonIcon /></Avatar>
                    )}
                    <Typography variant="h4" component="div">
                        {driver.name}
                    </Typography>
                </Box>
                <Box>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/drivers")} sx={{ mr: 1 }}>
                        Voltar
                    </Button>
                    <Button variant="contained" startIcon={<EditIcon />} component={RouterLink} to={`/drivers/edit/${driver.id}`}>
                        Editar Motorista
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
                <Grid item xs={12}><Chip label="Dados Pessoais" sx={{ fontWeight: "bold" }} /></Grid>
                <DetailItem label="Nome Completo" value={driver.name} />
                <DetailItem label="CPF" value={driver.cpf} />
                <DetailItem label="Data de Nascimento" value={new Date(driver.birth_date + "T00:00:00").toLocaleDateString("pt-BR")} />
                <DetailItem label="Telefone Principal" value={driver.phone} />
                <DetailItem label="E-mail" value={driver.email} />
                
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Documentação (CNH)" sx={{ fontWeight: "bold" }} /></Divider></Grid>
                <DetailItem label="Número da CNH" value={driver.cnh_number} />
                <DetailItem label="Categoria CNH" value={driver.cnh_category} />
                <DetailItem label="Validade da CNH" value={new Date(driver.cnh_expiration_date + "T00:00:00").toLocaleDateString("pt-BR")} />

                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Informações Contratuais" sx={{ fontWeight: "bold" }} /></Divider></Grid>
                <DetailItem label="Data de Admissão" value={new Date(driver.admission_date + "T00:00:00").toLocaleDateString("pt-BR")} />
                <DetailItem label="Status" value={<Chip label={driver.status.charAt(0).toUpperCase() + driver.status.slice(1)} color={driver.status === "ativo" ? "success" : driver.status === "inativo" || driver.status === "desligado" ? "error" : "default"} />} />

                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Endereço" sx={{ fontWeight: "bold" }} /></Divider></Grid>
                <Grid item xs={12}>
                    <AddressDisplay address={driver.address} />
                </Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Contato de Emergência" sx={{ fontWeight: "bold" }} /></Divider></Grid>
                <DetailItem label="Nome do Contato de Emergência" value={driver.emergency_contact_name} />
                <DetailItem label="Telefone do Contato de Emergência" value={driver.emergency_contact_phone} />
                
                <Grid item xs={12}><Divider sx={{ my: 1 }}><Chip label="Observações" sx={{ fontWeight: "bold" }} /></Divider></Grid>
                <Grid item xs={12}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{driver.notes || "Nenhuma nota adicional."}</Typography>
                </Grid>

                {/* Seção de Documentos do Motorista */} 
                <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Documentos Recentes do Motorista" sx={{ fontWeight: "bold" }} /></Divider></Grid>
                <Grid item xs={12}>
                    {docError && <Alert severity="warning" sx={{mb:1}}>{docError}</Alert>}
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<AddIcon />} 
                        component={RouterLink} 
                        to={`/documents/new?entityType=driver&entityId=${driver.id}&entityName=${encodeURIComponent(driver.name)}`} 
                        sx={{ mb: 1, mr:1 }}
                    >
                        Adicionar Documento
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<VisibilityIcon />} 
                        component={RouterLink} 
                        to={`/documents?entityType=driver&entityId=${driver.id}`} 
                        sx={{ mb: 1 }}
                    >
                        Ver Todos Documentos do Motorista
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
                                            <TableCell>{doc.document_type === "Outro" ? doc.custom_document_type_description || "Outro" : doc.document_type}</TableCell>
                                            <TableCell>{doc.expiration_date ? new Date(doc.expiration_date + "T00:00:00").toLocaleDateString("pt-BR") : "N/A"}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={doc.status_validity?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                                    size="small"
                                                    color={doc.status_validity === "vencido" ? "error" : doc.status_validity === "próximo_vencimento" ? "warning" : doc.status_validity === "válido" ? "success" : "default"}
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
                        <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>Nenhum documento recente para este motorista.</Alert>
                    )}
                </Grid>

                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <DetailItem label="ID do Motorista (Sistema)" value={driver.id} />
                <DetailItem label="Registrado em (Sistema)" value={driver.created_at ? new Date(driver.created_at).toLocaleString("pt-BR") : "N/A"} />
            </Grid>
        </Paper>
    );
};

export default DriverDetailPage;

