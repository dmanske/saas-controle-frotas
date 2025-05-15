import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Driver, DriverStatusType, CnhCategoryType } from '../types/driver';
import DriverPhotoUpload from '../components/DriverPhotoUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';

const DriverFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driver, setDriver] = useState<Partial<Driver>>({
    name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    email: '',
    cnh_number: '',
    cnh_category: 'B',
    cnh_expiration_date: '',
    status: 'ativo',
    admission_date: new Date().toISOString().split('T')[0],
    profile_picture_url: null,
  });
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);

  const driverStatusOptions: DriverStatusType[] = ['ativo', 'inativo', 'férias', 'afastado', 'desligado'];
  const cnhCategoryOptions: CnhCategoryType[] = ['A', 'B', 'AB', 'C', 'D', 'E', 'ACC'];

  useEffect(() => {
    if (id) {
      fetchDriver();
    }
  }, [id]);

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
          if (filePath) {
            const { data, error } = await supabase.storage
              .from('driver_photos')
              .createSignedUrl(filePath, 60 * 5); // 5 minutos
            if (error) {
              setSignedPhotoUrl(null);
            } else if (data?.signedUrl) {
              setSignedPhotoUrl(data.signedUrl);
            } else {
              setSignedPhotoUrl(null);
            }
          } else {
            setSignedPhotoUrl(null);
          }
        } catch {
          setSignedPhotoUrl(null);
        }
      } else {
        setSignedPhotoUrl(null);
      }
    };
    fetchSignedUrl();
  }, [driver?.profile_picture_url]);

  const fetchDriver = async () => {
    if (!user?.user_metadata?.tenant_id || !id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', user.user_metadata.tenant_id)
        .single();

      if (error) throw error;
      if (data) {
        setDriver(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar motorista:', err);
      setError('Erro ao carregar dados do motorista.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_metadata?.tenant_id) return;

    setLoading(true);
    setError(null);

    try {
      const driverData = {
        ...driver,
        tenant_id: user.user_metadata.tenant_id,
      };

      if (id) {
        const { error } = await supabase
          .from('drivers')
          .update(driverData)
          .eq('id', id)
          .eq('tenant_id', user.user_metadata.tenant_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert([driverData]);

        if (error) throw error;
      }

      navigate('/drivers');
    } catch (err: any) {
      console.error('Erro ao salvar motorista:', err);
      setError('Erro ao salvar motorista. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDriver(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUploaded = (url: string) => {
    setDriver(prev => ({ ...prev, profile_picture_url: url }));
  };

  const handlePhotoRemoved = () => {
    setDriver(prev => ({ ...prev, profile_picture_url: null }));
  };

  if (loading && id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Foto do motorista igual à tela de detalhes */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Foto do Motorista</Typography>
        <Avatar
          src={signedPhotoUrl || ''}
          alt="Foto do motorista"
          sx={{
            width: 200,
            height: 200,
            border: '4px solid',
            borderColor: 'primary.main',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            bgcolor: 'primary.light',
            mb: 2
          }}
        >
          {!signedPhotoUrl && <PersonIcon sx={{ fontSize: 100 }} />}
        </Avatar>
        <DriverPhotoUpload
          currentPhotoUrl={signedPhotoUrl}
          onPhotoUploaded={handlePhotoUploaded}
          onPhotoRemoved={handlePhotoRemoved}
        />
      </Box>
      <Paper sx={{ p: 4, margin: 'auto', overflow: 'hidden', maxWidth: 1200 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h4" sx={{ color: 'primary.main' }}>
            {id ? 'Editar Motorista' : 'Novo Motorista'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/drivers')}
          >
            Voltar
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            {/* Coluna dos Dados */}
            <Grid item xs={12} md={8}>
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

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Nome Completo"
                    name="name"
                    value={driver.name}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="CPF"
                    name="cpf"
                    value={driver.cpf}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Data de Nascimento"
                    name="birth_date"
                    type="date"
                    value={driver.birth_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Telefone Principal"
                    name="phone"
                    value={driver.phone}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    name="email"
                    value={driver.email}
                    onChange={handleChange}
                  />
                </Grid>

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

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Número da CNH"
                    name="cnh_number"
                    value={driver.cnh_number}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Categoria CNH"
                    name="cnh_category"
                    value={driver.cnh_category}
                    onChange={handleChange}
                  >
                    {cnhCategoryOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Validade da CNH"
                    name="cnh_expiration_date"
                    type="date"
                    value={driver.cnh_expiration_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

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

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Data de Admissão"
                    name="admission_date"
                    type="date"
                    value={driver.admission_date}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    select
                    label="Status"
                    name="status"
                    value={driver.status}
                    onChange={handleChange}
                  >
                    {driverStatusOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/drivers')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Salvar'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </>
  );
};

export default DriverFormPage; 