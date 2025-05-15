import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
    Box, Typography, Paper, CircularProgress, Alert, Grid, Button, Divider, Chip, Avatar 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Driver, DriverAddress } from '../types/driver';

const DriverDetailPage: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [driver, setDriver] = useState<Driver | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const fetchDriverDetails = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id || !id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*') // Selecionar todos os campos
                .eq('id', id)
                .eq('tenant_id', user.user_metadata.tenant_id)
                .single();

            if (error) throw error;
            if (data) {
                setDriver(data as Driver);
            } else {
                setError('Motorista não encontrado.');
            }
        } catch (err: any) {
            console.error('Erro ao buscar detalhes do motorista:', err);
            setError('Falha ao carregar detalhes do motorista. Verifique se a tabela "drivers" e suas colunas foram criadas corretamente no Supabase.');
        } finally {
            setLoading(false);
        }
    }, [user, id]);

    // Gerar signed URL para a foto do motorista
    useEffect(() => {
        const fetchSignedUrl = async () => {
            if (driver?.profile_picture_url) {
                try {
                    const url = driver.profile_picture_url;
                    let filePath = '';
                    if (!url) {
                      filePath = '';
                    } else if (url.startsWith('http') || url.startsWith('/')) {
                      const idx = url.indexOf('/driver_photos/');
                      if (idx !== -1) {
                        filePath = url.substring(idx + 15);
                      }
                    } else {
                      filePath = url;
                    }
                    console.log('profile_picture_url:', url);
                    console.log('filePath extraído:', filePath);
                    if (filePath) {
                        const { data, error } = await supabase.storage
                            .from('driver_photos')
                            .createSignedUrl(filePath, 60 * 5); // 5 minutos
                        if (error) {
                            console.error('Erro ao gerar signedUrl:', error);
                            setImageUrl(null);
                        } else if (data?.signedUrl) {
                            console.log('signedUrl gerada:', data.signedUrl);
                            setImageUrl(data.signedUrl);
                        } else {
                            console.error('Signed URL não gerada');
                            setImageUrl(null);
                        }
                    } else {
                        console.error('filePath não encontrado na URL');
                        setImageUrl(null);
                    }
                } catch (err) {
                    console.error('Erro ao processar URL da imagem:', err);
                    setImageUrl(null);
                }
            } else {
                setImageUrl(null);
            }
        };
        fetchSignedUrl();
    }, [driver?.profile_picture_url]);

    useEffect(() => {
        fetchDriverDetails();
    }, [fetchDriverDetails]);

    const DetailItem: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
        <Grid item xs={12} sm={fullWidth ? 12 : 6} md={fullWidth ? 12 : 4}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom component="div">{label}</Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }} component="div">{value || 'N/A'}</Typography>
        </Grid>
    );

    const AddressDisplay: React.FC<{ address: DriverAddress | null | undefined }> = ({ address }) => {
        if (!address) return <Typography variant="body1" component="div">N/A</Typography>;
        const { street, number, complement, neighborhood, city, state, cep } = address;
        let fullAddress = '';
        if (street) fullAddress += `${street}`;
        if (number) fullAddress += `, ${number}`;
        if (complement) fullAddress += ` - ${complement}`;
        if (neighborhood) fullAddress += `\n${neighborhood}`;
        if (city) fullAddress += ` - ${city}`;
        if (state) fullAddress += `/${state}`;
        if (cep) fullAddress += `\nCEP: ${cep}`;
        return <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }} component="div">{fullAddress || 'N/A'}</Typography>;
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!driver) return <Alert severity="info">Detalhes do motorista não disponíveis.</Alert>;

    return (
        <Paper sx={{ p: 4, margin: 'auto', overflow: 'hidden', maxWidth: 1200 }}>
            <Grid container spacing={4}>
                {/* Coluna da Foto */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 20
                    }}>
                        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>Foto do Motorista</Typography>
                        {imageUrl ? (
                            <Avatar
                                src={imageUrl}
                                alt="Foto do motorista"
                                sx={{
                                    width: 250,
                                    height: 250,
                                    border: '4px solid',
                                    borderColor: 'primary.main',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.02)'
                                    }
                                }}
                                onError={(e) => {
                                    console.error('Erro ao carregar imagem:', e);
                                    setImageUrl(null);
                                }}
                                onLoad={() => {
                                    console.log('Imagem carregada com sucesso');
                                }}
                            />
                        ) : (
                            <Avatar sx={{ 
                                width: 250, 
                                height: 250,
                                border: '4px solid',
                                borderColor: 'primary.main',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                bgcolor: 'primary.light'
                            }}>
                                <PersonIcon sx={{ fontSize: 120 }} />
                            </Avatar>
                        )}
                    </Box>
                </Grid>

                {/* Coluna dos Dados */}
                <Grid item xs={12} md={8}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Typography variant="h4" component="div" sx={{ color: 'primary.main' }}>
                            {driver.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/drivers')}
                            >
                                Voltar
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                component={RouterLink}
                                to={`/drivers/edit/${driver.id}`}
                            >
                                Editar
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Chip 
                                label="Dados Pessoais" 
                                sx={{ 
                                    fontWeight: 'bold',
                                    mb: 2,
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText'
                                }} 
                            />
                        </Grid>
                        <DetailItem label="Nome Completo" value={driver.name} />
                        <DetailItem label="CPF" value={driver.cpf} />
                        <DetailItem label="Data de Nascimento" value={new Date(driver.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')} />
                        <DetailItem label="Telefone Principal" value={driver.phone} />
                        <DetailItem label="E-mail" value={driver.email} />
                        
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Chip 
                                    label="Documentação (CNH)" 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText'
                                    }} 
                                />
                            </Divider>
                        </Grid>
                        <DetailItem label="Número da CNH" value={driver.cnh_number} />
                        <DetailItem label="Categoria CNH" value={driver.cnh_category} />
                        <DetailItem label="Validade da CNH" value={new Date(driver.cnh_expiration_date + 'T00:00:00').toLocaleDateString('pt-BR')} />

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Chip 
                                    label="Informações Contratuais" 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText'
                                    }} 
                                />
                            </Divider>
                        </Grid>
                        <DetailItem label="Data de Admissão" value={new Date(driver.admission_date + 'T00:00:00').toLocaleDateString('pt-BR')} />
                        <DetailItem label="Status" value={
                            <Chip 
                                label={driver.status.charAt(0).toUpperCase() + driver.status.slice(1)} 
                                color={driver.status === 'ativo' ? 'success' : driver.status === 'inativo' || driver.status === 'desligado' ? 'error' : 'default'}
                                sx={{ fontWeight: 'bold' }}
                            />
                        } />

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Chip 
                                    label="Endereço" 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText'
                                    }} 
                                />
                            </Divider>
                        </Grid>
                        <Grid item xs={12}>
                            <AddressDisplay address={driver.address} />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Chip 
                                    label="Contato de Emergência" 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText'
                                    }} 
                                />
                            </Divider>
                        </Grid>
                        <DetailItem label="Nome do Contato de Emergência" value={driver.emergency_contact_name} />
                        <DetailItem label="Telefone do Contato de Emergência" value={driver.emergency_contact_phone} />
                        
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }}>
                                <Chip 
                                    label="Observações" 
                                    sx={{ 
                                        fontWeight: 'bold',
                                        bgcolor: 'primary.light',
                                        color: 'primary.contrastText'
                                    }} 
                                />
                            </Divider>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                {driver.notes || 'Nenhuma nota adicional.'}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>
                        <DetailItem label="ID do Motorista (Sistema)" value={driver.id} />
                        <DetailItem label="Registrado em (Sistema)" value={driver.created_at ? new Date(driver.created_at).toLocaleString('pt-BR') : 'N/A'} />
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default DriverDetailPage;

