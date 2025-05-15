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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Vehicle } from '../types/vehicle';
import { Supply } from '../types/supply';

const VehicleDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [supplies, setSupplies] = useState<Supply[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVehicleDetails();
        fetchVehicleSupplies();
    }, [id]);

    const fetchVehicleDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setVehicle(data);
        } catch (err: any) {
            console.error('Erro ao buscar detalhes do veículo:', err);
            setError('Falha ao carregar detalhes do veículo.');
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleSupplies = async () => {
        try {
            const { data, error } = await supabase
                .from('supplies')
                .select('*')
                .eq('vehicle_id', id)
                .order('date', { ascending: false });

            if (error) throw error;
            setSupplies(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar abastecimentos:', err);
        }
    };

    if (loading) return <Typography>Carregando...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!vehicle) return <Typography>Veículo não encontrado.</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/vehicles')}
                >
                    Voltar
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/vehicles/${id}/edit`)}
                >
                    Editar
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Detalhes do Veículo
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Placa
                        </Typography>
                        <Typography variant="body1">
                            {vehicle.plate}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Modelo
                        </Typography>
                        <Typography variant="body1">
                            {vehicle.model}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Marca
                        </Typography>
                        <Typography variant="body1">
                            {vehicle.brand}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Ano
                        </Typography>
                        <Typography variant="body1">
                            {vehicle.year}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Cor
                        </Typography>
                        <Typography variant="body1">
                            {vehicle.color}
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Status
                        </Typography>
                        <Typography variant="body1">
                            {vehicle.status}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Histórico de Abastecimentos
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Data</TableCell>
                                <TableCell>Combustível</TableCell>
                                <TableCell>Litros</TableCell>
                                <TableCell>Preço/L</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Hodômetro</TableCell>
                                <TableCell>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {supplies.map((supply) => (
                                <TableRow key={supply.id}>
                                    <TableCell>
                                        {new Date(supply.supply_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{supply.fuel_type}</TableCell>
                                    <TableCell>{supply.quantity_liters.toFixed(2)}</TableCell>
                                    <TableCell>R$ {supply.price_per_unit.toFixed(3)}</TableCell>
                                    <TableCell>R$ {supply.total_cost.toFixed(2)}</TableCell>
                                    <TableCell>{supply.odometer_reading} km</TableCell>
                                    <TableCell>
                                        <Button
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => navigate(`/supplies/${supply.id}`)}
                                        >
                                            Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default VehicleDetailPage;

