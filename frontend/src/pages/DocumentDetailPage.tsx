import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DocumentMetadata, DocumentStatus } from '../types/document';
import {
    Box, Typography, Paper, CircularProgress, Alert, Button, Grid, Chip, IconButton, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description'; // Icon for document details
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business'; // For issuing authority
import FingerprintIcon from '@mui/icons-material/Fingerprint'; // For document number
import LinkIcon from '@mui/icons-material/Link'; // For entity association
import AttachFileIcon from '@mui/icons-material/AttachFile';

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

const DocumentDetailPage: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [docData, setDocData] = useState<DocumentMetadata | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [associatedEntityName, setAssociatedEntityName] = useState<string>('');

    const fetchDocumentDetails = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: docError } = await supabase
                .from('documents')
                .select(`
                    *,
                    vehicles!vehicle_id(plate, model),
                    drivers!driver_id(name, cpf)
                `)
                .eq('id', id)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();

            if (docError) throw docError;
            if (!data) throw new Error('Documento não encontrado.');

            const status_validity = getDocumentStatus(data.expiration_date);
            let entityDisplay = 'N/A';
            if (data.entity_type === 'vehicle' && data.vehicles) {
                entityDisplay = `${data.vehicles.plate} (${data.vehicles.model || 'N/A'})`;
            } else if (data.entity_type === 'driver' && data.drivers) {
                entityDisplay = `${data.drivers.name} (${data.drivers.cpf || 'N/A'})`;
            }
            setAssociatedEntityName(entityDisplay);
            setDocData({ ...data, status_validity });

        } catch (err: any) {
            console.error('Erro ao buscar detalhes do documento:', err);
            setError('Falha ao carregar detalhes do documento. Verifique se o ID é válido e se a tabela `documents` e seus relacionamentos foram criados corretamente.');
        } finally {
            setLoading(false);
        }
    }, [user, id]);

    useEffect(() => {
        fetchDocumentDetails();
    }, [fetchDocumentDetails]);

    const handleDownloadFile = async (fileUrl?: string | null, fileName?: string | null) => {
        if (!fileUrl) {
            setError('URL do arquivo não encontrada.');
            return;
        }
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
            const blob = await response.blob();
            const link = window.document.createElement('a') as HTMLAnchorElement;
            link.href = URL.createObjectURL(blob);
            link.download = fileName || 'documento';
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err: any) {
            console.error('Erro ao baixar arquivo:', err);
            setError(`Falha ao baixar o arquivo: ${err.message}`);
        }
    };
    
    // Placeholder for delete functionality, can be expanded with a dialog
    const handleDelete = async () => {
        if (!docData || !user || !user.user_metadata?.tenant_id) return;
        if (window.confirm(`Tem certeza que deseja excluir o documento "${docData.document_name}"? Esta ação também removerá o arquivo associado, se houver.`)) {
            try {
                if (docData.file_url) {
                    const filePath = new URL(docData.file_url).pathname.split('/render/storage/v1/object/public/')[1];
                    if (filePath) {
                        await supabase.storage.from('document-files').remove([filePath]);
                    }
                }
                const { error: deleteError } = await supabase
                    .from('documents')
                    .delete()
                    .eq('id', docData.id)
                    .eq('tenant_id', user.user_metadata.tenant_id);
                if (deleteError) throw deleteError;
                navigate('/documents');
            } catch (err: any) {
                setError(`Falha ao excluir documento: ${err.message}`);
            }
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    if (!docData) return <Alert severity="warning" sx={{ m: 2 }}>Documento não encontrado.</Alert>;

    const doc = docData;

    // Função auxiliar para criar elementos do DOM
    const createDOMElement = (tag: string) => {
        if (typeof window !== 'undefined' && window.document) {
            return window.document.createElement(tag) as HTMLAnchorElement;
        }
        return null;
    };

    // Função auxiliar para manipular o DOM
    const manipulateDOM = (element: HTMLAnchorElement | null) => {
        if (element && typeof window !== 'undefined' && window.document && window.document.body) {
            window.document.body.appendChild(element);
            element.click();
            window.document.body.removeChild(element);
        }
    };

    // Função auxiliar para baixar arquivo
    const downloadFile = async (fileUrl: string, fileName: string) => {
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error(`Falha ao baixar o arquivo: ${response.statusText}`);
            const blob = await response.blob();
            const link = createDOMElement('a');
            if (link) {
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                manipulateDOM(link);
                URL.revokeObjectURL(link.href);
            }
        } catch (err: any) {
            console.error('Erro ao baixar arquivo:', err);
            setError(`Falha ao baixar o arquivo: ${err.message}`);
        }
    };

    const detailItem = (label: string, value?: string | null | React.ReactNode, icon?: React.ReactNode) => (
        <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            {icon && <Box sx={{ mr: 1.5, color: 'text.secondary' }}>{icon}</Box>}
            <Box>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body1">{value || 'N/A'}</Typography>
            </Box>
        </Grid>
    );

    return (
        <Paper sx={{ p: 3, maxWidth: 800, margin: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={() => navigate("/documents")} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="div">
                        Detalhes do Documento
                    </Typography>
                </Box>
                <Box>
                    {doc.file_url && (
                        <Tooltip title="Baixar Arquivo">
                            <Button 
                                variant="outlined" 
                                startIcon={<FileDownloadIcon />} 
                                onClick={() => handleDownloadFile(doc.file_url, doc.file_name)} 
                                sx={{ mr: 1 }}
                            >
                                Baixar
                            </Button>
                        </Tooltip>
                    )}
                    <Tooltip title="Editar Documento">
                        <IconButton color="primary" component={RouterLink} to={`/documents/edit/${doc.id}`} sx={{ mr: 0.5 }}>
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir Documento">
                        <IconButton color="error" onClick={handleDelete}>
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={2} sx={{ p: 2, border: '1px solid #eee', borderRadius: '4px' }}>
                {detailItem('Nome Descritivo', doc.document_name, <DescriptionIcon />)}
                {detailItem('Tipo de Documento', doc.document_type === 'Outro' ? doc.custom_document_type_description || 'Outro' : doc.document_type, <DescriptionIcon />)}
                {detailItem('Número do Documento', doc.document_number, <FingerprintIcon />)}
                {detailItem('Órgão Emissor', doc.issuing_authority, <BusinessIcon />)}
                {detailItem('Data de Emissão', doc.issue_date ? new Date(doc.issue_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A', <CalendarTodayIcon />)}
                {detailItem('Data de Validade', 
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography component="span">
                            {doc.expiration_date ? new Date(doc.expiration_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                        </Typography>
                        <Chip 
                            label={doc.status_validity?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            size="small"
                            color={
                                doc.status_validity === 'vencido' ? 'error' :
                                doc.status_validity === 'próximo_vencimento' ? 'warning' :
                                doc.status_validity === 'válido' ? 'success' : 'default'
                            }
                            sx={{ ml: 1 }}
                        />
                    </Box>,
                    <CalendarTodayIcon />
                )}
                {detailItem('Associado a', `${doc.entity_type === 'vehicle' ? 'Veículo' : 'Motorista'}: ${associatedEntityName}`, <LinkIcon />)}
                {doc.file_name && detailItem('Nome do Arquivo', doc.file_name, <AttachFileIcon />)}
                {doc.file_size && detailItem('Tamanho do Arquivo', `${(doc.file_size / 1024).toFixed(2)} KB`, <AttachFileIcon />)}
                {doc.file_type && detailItem('Tipo do Arquivo (MIME)', doc.file_type, <AttachFileIcon />)}
                
                <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">Descrição/Observações</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt:0.5 }}>{doc.description || 'Nenhuma descrição fornecida.'}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">Notas Adicionais</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt:0.5 }}>{doc.notes || 'Nenhuma nota adicional.'}</Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default DocumentDetailPage;

