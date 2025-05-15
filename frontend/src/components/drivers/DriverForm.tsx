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
import { DriverFormData, CnhCategoryType, DriverStatusType, DriverAddress } from '../../types/driver'; // Ajuste o caminho
import DriverPhotoUpload from '../DriverPhotoUpload';

interface DriverFormProps {
    isEditMode?: boolean;
}

const DriverForm: React.FC<DriverFormProps> = ({ isEditMode = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id: driverId } = useParams<{ id: string }>();

    const [formData, setFormData] = useState<DriverFormData>({
        name: '',
        cpf: '',
        birth_date: '',
        phone: '',
        email: '',
        profile_picture_url: '',
        cnh_number: '',
        cnh_category: 'B',
        cnh_expiration_date: '',
        admission_date: '',
        status: 'ativo',
        address_cep: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof DriverFormData, string>>>({});

    const cnhCategoryOptions: CnhCategoryType[] = ['A', 'B', 'AB', 'C', 'D', 'E', 'ACC'];
    const driverStatusOptions: DriverStatusType[] = ['ativo', 'inativo', 'férias', 'afastado', 'desligado'];
    // TODO: Adicionar lista de estados (UF) para o dropdown
    const ufOptions = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];


    const fetchDriverDetails = useCallback(async (id: string) => {
        if (!user || !user.user_metadata?.tenant_id) return;
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
                const address = data.address as DriverAddress | null;
                setFormData({
                    ...data,
                    address_cep: address?.cep || '',
                    address_street: address?.street || '',
                    address_number: address?.number || '',
                    address_complement: address?.complement || '',
                    address_neighborhood: address?.neighborhood || '',
                    address_city: address?.city || '',
                    address_state: address?.state || '',
                });
            }
        } catch (err: any) {
            console.error('Erro ao buscar detalhes do motorista:', err);
            setFormError('Falha ao carregar dados do motorista para edição. Verifique se a tabela e as colunas existem no Supabase.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isEditMode && driverId) {
            fetchDriverDetails(driverId);
        }
    }, [isEditMode, driverId, fetchDriverDetails]);

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof DriverFormData, string>> = {};
        if (!formData.name.trim()) errors.name = 'Nome completo é obrigatório.';
        if (!formData.cpf.trim()) errors.cpf = 'CPF é obrigatório.'; // TODO: Adicionar validação de formato de CPF
        if (!formData.birth_date) errors.birth_date = 'Data de nascimento é obrigatória.';
        if (!formData.phone.trim()) errors.phone = 'Telefone é obrigatório.';
        if (!formData.cnh_number.trim()) errors.cnh_number = 'Número da CNH é obrigatório.';
        if (!formData.cnh_category) errors.cnh_category = 'Categoria da CNH é obrigatória.';
        if (!formData.cnh_expiration_date) errors.cnh_expiration_date = 'Data de validade da CNH é obrigatória.';
        if (!formData.admission_date) errors.admission_date = 'Data de admissão é obrigatória.';
        if (!formData.status) errors.status = 'Status é obrigatório.';

        // Validação de e-mail (simples)
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Formato de e-mail inválido.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name!]: value }));
        if (validationErrors[name as keyof DriverFormData]) {
            setValidationErrors(prev => ({ ...prev, [name!]: undefined }));
        }
    };
    
    const handleSelectChange = (e: any) => { // MUI SelectChangeEvent
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name!]: value as string }));
        if (validationErrors[name as keyof DriverFormData]) {
            setValidationErrors(prev => ({ ...prev, [name!]: undefined }));
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

        const addressData: DriverAddress = {
            cep: formData.address_cep || null,
            street: formData.address_street || null,
            number: formData.address_number || null,
            complement: formData.address_complement || null,
            neighborhood: formData.address_neighborhood || null,
            city: formData.address_city || null,
            state: formData.address_state || null,
        };

        const dataToSave = {
            name: formData.name,
            cpf: formData.cpf,
            birth_date: formData.birth_date,
            phone: formData.phone,
            email: formData.email || null,
            profile_picture_url: formData.profile_picture_url || null,
            cnh_number: formData.cnh_number,
            cnh_category: formData.cnh_category,
            cnh_expiration_date: formData.cnh_expiration_date,
            admission_date: formData.admission_date,
            status: formData.status,
            address: addressData,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,
            notes: formData.notes || null,
            tenant_id: user.user_metadata.tenant_id,
        };

        try {
            if (isEditMode && driverId) {
                const { error } = await supabase
                    .from('drivers')
                    .update(dataToSave)
                    .eq('id', driverId)
                    .eq('tenant_id', user.user_metadata.tenant_id);
                if (error) throw error;
                navigate('/drivers');
            } else {
                const { error } = await supabase
                    .from('drivers')
                    .insert(dataToSave);
                if (error) throw error;
                navigate('/drivers');
            }
        } catch (err: any) {
            console.error('Erro ao salvar motorista:', err);
            setFormError(`Falha ao salvar motorista: ${err.message || 'Verifique os dados e tente novamente. Certifique-se que a tabela "drivers" e suas colunas foram criadas corretamente no Supabase.'}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formError) return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom component="div">
                {isEditMode ? 'Editar Dados do Motorista' : 'Adicionar Novo Motorista'}
            </Typography>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <DriverPhotoUpload
                            currentPhotoUrl={formData.profile_picture_url}
                            onPhotoUploaded={url => setFormData(prev => ({ ...prev, profile_picture_url: url }))}
                            onPhotoRemoved={() => setFormData(prev => ({ ...prev, profile_picture_url: '' }))}
                        />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}><Typography variant="h6">Dados Pessoais</Typography></Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Nome Completo *" name="name" value={formData.name} onChange={handleChange} fullWidth error={!!validationErrors.name} helperText={validationErrors.name} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="CPF *" name="cpf" value={formData.cpf} onChange={handleChange} fullWidth error={!!validationErrors.cpf} helperText={validationErrors.cpf} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Data de Nascimento *" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} error={!!validationErrors.birth_date} helperText={validationErrors.birth_date} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="Telefone Principal *" name="phone" value={formData.phone} onChange={handleChange} fullWidth error={!!validationErrors.phone} helperText={validationErrors.phone} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField label="E-mail" name="email" value={formData.email} onChange={handleChange} fullWidth error={!!validationErrors.email} helperText={validationErrors.email} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Documentação (CNH)</Typography></Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Número da CNH *" name="cnh_number" value={formData.cnh_number} onChange={handleChange} fullWidth error={!!validationErrors.cnh_number} helperText={validationErrors.cnh_number} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select label="Categoria CNH *" name="cnh_category" value={formData.cnh_category} onChange={handleSelectChange} fullWidth error={!!validationErrors.cnh_category} helperText={validationErrors.cnh_category}>
                            {cnhCategoryOptions.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Validade da CNH *" name="cnh_expiration_date" type="date" value={formData.cnh_expiration_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} error={!!validationErrors.cnh_expiration_date} helperText={validationErrors.cnh_expiration_date} />
                    </Grid>

                    <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Informações Contratuais</Typography></Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Data de Admissão *" name="admission_date" type="date" value={formData.admission_date} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} error={!!validationErrors.admission_date} helperText={validationErrors.admission_date} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField select label="Status *" name="status" value={formData.status} onChange={handleSelectChange} fullWidth error={!!validationErrors.status} helperText={validationErrors.status}>
                            {driverStatusOptions.map(stat => <MenuItem key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Endereço</Typography></Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="CEP" name="address_cep" value={formData.address_cep || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField label="Logradouro" name="address_street" value={formData.address_street || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Número" name="address_number" value={formData.address_number || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField label="Complemento" name="address_complement" value={formData.address_complement || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Bairro" name="address_neighborhood" value={formData.address_neighborhood || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField label="Cidade" name="address_city" value={formData.address_city || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                         <TextField select label="UF" name="address_state" value={formData.address_state || ''} onChange={handleSelectChange} fullWidth >
                            <MenuItem value=""><em>Selecione</em></MenuItem>
                            {ufOptions.map(uf => <MenuItem key={uf} value={uf}>{uf}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Contato de Emergência</Typography></Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Nome do Contato" name="emergency_contact_name" value={formData.emergency_contact_name || ''} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField label="Telefone do Contato" name="emergency_contact_phone" value={formData.emergency_contact_phone || ''} onChange={handleChange} fullWidth />
                    </Grid>

                    <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Observações</Typography></Grid>
                    <Grid item xs={12}>
                        <TextField label="Notas Adicionais" name="notes" value={formData.notes || ''} onChange={handleChange} fullWidth multiline rows={3} />
                    </Grid>

                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/drivers')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={loading}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Atualizar Dados' : 'Salvar Motorista')}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default DriverForm;

