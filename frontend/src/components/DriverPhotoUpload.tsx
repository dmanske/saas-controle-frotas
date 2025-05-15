import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, IconButton, Avatar } from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DriverPhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUploaded: (url: string) => void;
  onPhotoRemoved: () => void;
}

const DriverPhotoUpload: React.FC<DriverPhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  // LOG do usuário completo para depuração
  useEffect(() => {
    if (user) {
      console.log('user:', JSON.stringify(user, null, 2));
    }
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || !event.target.files[0]) return;
      if (!user?.user_metadata?.tenant_id) return;

      setUploading(true);
      const file = event.target.files[0];
      
      // LOGS DE DEPURAÇÃO
      console.log('tenant_id:', user.user_metadata.tenant_id);

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem.');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB.');
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.user_metadata.tenant_id}/${fileName}`;

      console.log('filePath:', filePath);

      // Upload para o Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('driver_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('driver_photos')
        .getPublicUrl(filePath);

      onPhotoUploaded(publicUrl);
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error);
      alert(error.message || 'Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (!currentPhotoUrl || !user?.user_metadata?.tenant_id) return;

      // Extrair o nome do arquivo da URL
      const fileName = currentPhotoUrl.split('/').pop();
      if (!fileName) return;

      const filePath = `${user.user_metadata.tenant_id}/${fileName}`;

      // Remover do Storage
      const { error } = await supabase.storage
        .from('driver_photos')
        .remove([filePath]);

      if (error) throw error;

      onPhotoRemoved();
    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      alert('Erro ao remover foto. Tente novamente.');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', width: 150, height: 150 }}>
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt="Foto do motorista"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              display: 'block',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Avatar sx={{ width: 150, height: 150 }} />
        )}
        {currentPhotoUrl && (
          <IconButton
            onClick={handleRemovePhoto}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            <Delete />
          </IconButton>
        )}
      </Box>

      <Button
        variant="contained"
        component="label"
        startIcon={uploading ? <CircularProgress size={20} /> : <PhotoCamera />}
        disabled={uploading}
      >
        {currentPhotoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileUpload}
        />
      </Button>
    </Box>
  );
};

export default DriverPhotoUpload; 