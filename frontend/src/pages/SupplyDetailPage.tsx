import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Supply } from '../types/supply';

const SupplyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [supply, setSupply] = useState<Supply | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSupplyDetails();
    }, [id]);

    const fetchSupplyDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('supplies')
                .select(`
                    *,
                    vehicles (
                        id,
                        plate,
                        model,
                        brand
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setSupply(data);
        } catch (err: any) {
            console.error('Erro ao buscar detalhes do abastecimento:', err);
            setError('Falha ao carregar detalhes do abastecimento.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Typography>Carregando...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!supply) return <Typography>Abastecimento não encontrado.</Typography>;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/supplies')}
                >
                    Voltar
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/supplies/${id}/edit`)}
                >
                    Editar
                </Button>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Detalhes do Abastecimento
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Veículo
                        </Typography>
                        <Typography variant="body1">
                            {supply.vehicles?.plate} - {supply.vehicles?.model}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Data do Abastecimento
                        </Typography>
                        <Typography variant="body1">
                            {new Date(supply.supply_date).toLocaleDateString()}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Tipo de Combustível
                        </Typography>
                        <Typography variant="body1">
                            {supply.fuel_type}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Hodômetro
                        </Typography>
                        <Typography variant="body1">
                            {supply.odometer_reading} km
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Quantidade
                        </Typography>
                        <Typography variant="body1">
                            {supply.quantity_liters.toFixed(2)} litros
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Preço por Litro
                        </Typography>
                        <Typography variant="body1">
                            R$ {supply.price_per_unit.toFixed(3)}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Custo Total
                        </Typography>
                        <Typography variant="h6">
                            R$ {supply.total_cost.toFixed(2)}
                        </Typography>
                    </Grid>

                    {supply.notes && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Observações
                            </Typography>
                            <Typography variant="body1">
                                {supply.notes}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Container>
    );
};

export default SupplyDetailPage;

