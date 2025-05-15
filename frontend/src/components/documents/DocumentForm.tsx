import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../services/supabase"; // Corrected path based on ESTRUTURA_PROJETO.md (assuming services is one level up from components)
import { useAuth } from "../../contexts/AuthContext"; // Corrected path
import { DocumentMetadata, DocumentFormData, KnownDocumentType, DocumentEntityType } from "../../types/document"; // Corrected path
import { Vehicle } from "../../types/vehicle"; // Corrected path
import { Driver } from "../../types/driver"; // Corrected path
import {
    Box, Button, TextField, Typography, Paper, Grid, CircularProgress, Alert,
    MenuItem, FormControl, InputLabel, Select, SelectChangeEvent, FormHelperText, Autocomplete,
    IconButton
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AttachFileIcon from "@mui/icons-material/AttachFile";

interface DocumentFormProps {
    isEditMode?: boolean;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ isEditMode = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [formData, setFormData] = useState<DocumentFormData>({
        document_name: "",
        document_type: "",
        custom_document_type_description: "",
        description: "",
        entity_type: "",
        entity_id: "",
        issue_date: null,
        expiration_date: null,
        issuing_authority: "",
        document_number: "",
        file_to_upload: null,
        current_file_name: null,
        remove_current_file: false,
        notes: "",
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    const documentTypeOptions: KnownDocumentType[] = ["CNH", "CRLV", "Apólice de Seguro", "Certificado de Inspeção Veicular", "Certificado de Curso", "Comprovante de Endereço", "RG", "CPF", "Outro"];
    const entityTypeOptions: DocumentEntityType[] = ["vehicle", "driver"];

    const fetchAssociatedEntities = useCallback(async () => {
        if (!user || !user.user_metadata?.tenant_id) return;
        try {
            const [vehicleRes, driverRes] = await Promise.all([
                supabase.from("vehicles").select("*").eq("tenant_id", user.user_metadata.tenant_id),
                supabase.from("drivers").select("*").eq("tenant_id", user.user_metadata.tenant_id)
            ]);
            if (vehicleRes.error) throw vehicleRes.error;
            if (driverRes.error) throw driverRes.error;
            setVehicles(vehicleRes.data as Vehicle[] || []);
            setDrivers(driverRes.data as Driver[] || []);
        } catch (err) {
            console.error("Erro ao buscar entidades associadas:", err);
            setFormError("Falha ao carregar veículos e motoristas para associação.");
        }
    }, [user]);

    const fetchDocumentData = useCallback(async (documentId: string) => {
        if (!user || !user.user_metadata?.tenant_id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .eq("id", documentId)
                .eq("tenant_id", user.user_metadata.tenant_id)
                .single();
            if (error) throw error;
            if (data) {
                setFormData({
                    id: data.id,
                    document_name: data.document_name || "",
                    document_type: data.document_type || "",
                    custom_document_type_description: data.custom_document_type_description || "",
                    description: data.description || "",
                    entity_type: data.entity_type || "",
                    entity_id: data.entity_id || "",
                    issue_date: data.issue_date ? data.issue_date.split("T")[0] : null,
                    expiration_date: data.expiration_date ? data.expiration_date.split("T")[0] : null,
                    issuing_authority: data.issuing_authority || "",
                    document_number: data.document_number || "",
                    current_file_name: data.file_name || null,
                    notes: data.notes || "",
                    file_to_upload: null,
                    remove_current_file: false,
                });
                setFileName(data.file_name || "");
            }
        } catch (err: any) {
            console.error("Erro ao buscar dados do documento:", err);
            setFormError("Falha ao carregar dados do documento. Verifique se o ID é válido e se a tabela `documents` existe.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAssociatedEntities();
        if (isEditMode && id) {
            fetchDocumentData(id);
        } else if (!isEditMode) {
            // Reset form for new entry
            setFormData({
                document_name: "", document_type: "", custom_document_type_description: "",
                description: "", entity_type: "", entity_id: "",
                issue_date: null, expiration_date: null, issuing_authority: "",
                document_number: "", file_to_upload: null, current_file_name: null,
                remove_current_file: false, notes: "",
            });
            setFileName("");
        }
    }, [isEditMode, id, fetchDocumentData, fetchAssociatedEntities]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === "document_type" && value !== "Outro") {
            setFormData(prev => ({ ...prev, custom_document_type_description: "" }));
        }
        if (name === "entity_type") {
            setFormData(prev => ({ ...prev, entity_id: "" })); // Reset entity_id when type changes
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setFormData(prev => ({ ...prev, file_to_upload: file, remove_current_file: false }));
            setFileName(file.name);
        } else {
            setFormData(prev => ({ ...prev, file_to_upload: null }));
            if (!formData.current_file_name) setFileName("");
        }
    };

    const handleRemoveFile = () => {
        setFormData(prev => ({ ...prev, file_to_upload: null, remove_current_file: true }));
        setFileName("");
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !user.user_metadata?.tenant_id) {
            setFormError("Usuário não autenticado ou tenant_id não encontrado.");
            return;
        }
        if (!formData.entity_type || !formData.entity_id) {
            setFormError("Por favor, selecione o tipo de entidade e a entidade específica.");
            return;
        }

        setLoading(true);
        setUploading(false);
        setFormError(null);
        setSuccessMessage(null);

        let fileUrl: string | null = isEditMode && formData.current_file_name && !formData.remove_current_file && !formData.file_to_upload 
            ? (await supabase.from("documents").select("file_url").eq("id", id).single()).data?.file_url || null 
            : null;
        let uploadedFileName: string | null = isEditMode && formData.current_file_name && !formData.remove_current_file && !formData.file_to_upload 
            ? formData.current_file_name 
            : null;
        let uploadedFileSize: number | null = null;
        let uploadedFileType: string | null = null;

        try {
            // 1. Handle file removal if requested
            if (isEditMode && formData.remove_current_file && formData.current_file_name) {
                const currentDoc = (await supabase.from("documents").select("file_url").eq("id", id).single()).data;
                if (currentDoc?.file_url) {
                    const oldFilePath = new URL(currentDoc.file_url).pathname.split("/render/storage/v1/object/public/")[1];
                    if (oldFilePath) {
                        await supabase.storage.from("document-files").remove([oldFilePath]);
                    }
                }
                fileUrl = null;
                uploadedFileName = null;
            }

            // 2. Handle new file upload
            if (formData.file_to_upload) {
                setUploading(true);
                // If editing and there was an old file, remove it first
                if (isEditMode && formData.current_file_name && !formData.remove_current_file) {
                     const currentDoc = (await supabase.from("documents").select("file_url").eq("id", id).single()).data;
                    if (currentDoc?.file_url) {
                        const oldFilePath = new URL(currentDoc.file_url).pathname.split("/render/storage/v1/object/public/")[1];
                        if (oldFilePath) {
                           await supabase.storage.from("document-files").remove([oldFilePath]);
                        }
                    }
                }

                const newFile = formData.file_to_upload;
                const filePath = `${user.user_metadata.tenant_id}/${formData.entity_type}/${formData.entity_id}/${Date.now()}_${newFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("document-files")
                    .upload(filePath, newFile);

                if (uploadError) throw uploadError;
                
                // Get public URL. Ensure RLS on `document-files` bucket allows public read or use signed URLs for private files.
                const { data: publicUrlData } = supabase.storage.from("document-files").getPublicUrl(filePath);
                fileUrl = publicUrlData.publicUrl;
                uploadedFileName = newFile.name;
                uploadedFileSize = newFile.size;
                uploadedFileType = newFile.type;
                setUploading(false);
            }

            const documentToSave: Omit<DocumentMetadata, "id" | "created_at" | "vehicle_plate" | "driver_name" | "status_validity"> = {
                tenant_id: user.user_metadata.tenant_id,
                document_name: formData.document_name,
                document_type: formData.document_type,
                custom_document_type_description: formData.document_type === "Outro" ? formData.custom_document_type_description : null,
                description: formData.description || null,
                entity_type: formData.entity_type as DocumentEntityType,
                entity_id: formData.entity_id,
                vehicle_id: formData.entity_type === 'vehicle' ? formData.entity_id : null,
                driver_id: formData.entity_type === 'driver' ? formData.entity_id : null,
                issue_date: formData.issue_date || null,
                expiration_date: formData.expiration_date || null,
                issuing_authority: formData.issuing_authority || null,
                document_number: formData.document_number || null,
                file_url: fileUrl,
                file_name: uploadedFileName,
                file_size: uploadedFileSize,
                file_type: uploadedFileType,
                notes: formData.notes || null,
            };

            // Logs para debug
            console.log('User metadata:', user.user_metadata);
            console.log('Tenant ID:', user.user_metadata?.tenant_id);
            console.log('Document to save:', documentToSave);

            if (isEditMode && id) {
                const { error: updateError } = await supabase
                    .from("documents")
                    .update(documentToSave)
                    .eq("id", id)
                    .eq("tenant_id", user.user_metadata.tenant_id);
                if (updateError) throw updateError;
                setSuccessMessage("Documento atualizado com sucesso!");
            } else {
                const { error: insertError } = await supabase
                    .from("documents")
                    .insert(documentToSave);
                if (insertError) {
                    console.error('Erro detalhado do insert:', insertError);
                    throw insertError;
                }
                setSuccessMessage("Documento adicionado com sucesso!");
            }
            setTimeout(() => navigate("/documents"), 2000);

        } catch (err: any) {
            console.error("Erro ao salvar documento:", err);
            setFormError(`Falha ao salvar documento: ${err.message}. Verifique se a tabela 'documents' e o bucket 'document-files' (com as permissões adequadas) existem no Supabase.`);
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}><CircularProgress /></Box>;

    return (
        <Paper sx={{ p: 3, maxWidth: 800, margin: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <IconButton onClick={() => navigate("/documents")} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">{isEditMode ? "Editar Documento" : "Adicionar Novo Documento"}</Typography>
            </Box>

            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>Informações do Documento</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="document_name" label="Nome Descritivo do Documento" value={formData.document_name} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required error={!formData.document_type}>
                            <InputLabel id="document-type-label">Tipo de Documento</InputLabel>
                            <Select labelId="document-type-label" name="document_type" value={formData.document_type} label="Tipo de Documento" onChange={handleChange}>
                                {documentTypeOptions.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                            </Select>
                            {!formData.document_type && <FormHelperText>Obrigatório</FormHelperText>}
                        </FormControl>
                    </Grid>
                    {formData.document_type === "Outro" && (
                        <Grid item xs={12}>
                            <TextField name="custom_document_type_description" label="Especifique o Tipo de Documento" value={formData.custom_document_type_description || ""} onChange={handleChange} fullWidth required />
                        </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                        <TextField name="document_number" label="Número do Documento" value={formData.document_number || ""} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="issuing_authority" label="Órgão Emissor" value={formData.issuing_authority || ""} onChange={handleChange} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="issue_date" label="Data de Emissão" type="date" value={formData.issue_date || ""} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField name="expiration_date" label="Data de Validade" type="date" value={formData.expiration_date || ""} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField name="description" label="Descrição/Observações" value={formData.description || ""} onChange={handleChange} fullWidth multiline rows={3} />
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>Associação do Documento</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required error={!formData.entity_type}>
                            <InputLabel id="entity-type-label">Associar a</InputLabel>
                            <Select labelId="entity-type-label" name="entity_type" value={formData.entity_type} label="Associar a" onChange={handleChange}>
                                <MenuItem value=""><em>Selecione...</em></MenuItem>
                                {entityTypeOptions.map(type => <MenuItem key={type} value={type}>{type === "vehicle" ? "Veículo" : "Motorista"}</MenuItem>)}
                            </Select>
                            {!formData.entity_type && <FormHelperText>Obrigatório</FormHelperText>}
                        </FormControl>
                    </Grid>
                    {formData.entity_type && (
                        <Grid item xs={12} sm={6}>
                            {formData.entity_type === "vehicle" ? (
                                <Autocomplete
                                    options={vehicles}
                                    getOptionLabel={(option: Vehicle) => `${option.plate} (${option.model || "N/A"})`}
                                    value={vehicles.find(v => v.id === formData.entity_id) || null}
                                    onChange={(_, newValue: Vehicle | null) => {
                                        setFormData(prev => ({ ...prev, entity_id: newValue?.id || "" }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Veículo Associado"
                                            required
                                            error={!formData.entity_id && formData.entity_type === "vehicle"}
                                            helperText={!formData.entity_id && formData.entity_type === "vehicle" ? "Selecione um veículo" : ""}
                                        />
                                    )}
                                />
                            ) : formData.entity_type === "driver" ? (
                                <Autocomplete
                                    options={drivers}
                                    getOptionLabel={(option: Driver) => `${option.name} (${option.cpf || "N/A"})`}
                                    value={drivers.find(d => d.id === formData.entity_id) || null}
                                    onChange={(_, newValue: Driver | null) => {
                                        setFormData(prev => ({ ...prev, entity_id: newValue?.id || "" }));
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Motorista Associado"
                                            required
                                            error={!formData.entity_id && formData.entity_type === "driver"}
                                            helperText={!formData.entity_id && formData.entity_type === "driver" ? "Selecione um motorista" : ""}
                                        />
                                    )}
                                />
                            ) : null}
                        </Grid>
                    )}

                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>Arquivo do Documento</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                            Selecionar Arquivo
                            <input type="file" hidden onChange={handleFileChange} />
                        </Button>
                        {fileName && (
                            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                <AttachFileIcon sx={{ mr: 1 }} />
                                <Typography variant="body2" sx={{ mr: 2 }}>{fileName}</Typography>
                                <Button size="small" color="error" onClick={handleRemoveFile} disabled={uploading}>
                                    Remover
                                </Button>
                            </Box>
                        )}
                        {isEditMode && formData.current_file_name && !formData.file_to_upload && !formData.remove_current_file && (
                             <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                <AttachFileIcon sx={{ mr: 1 }} color="success"/>
                                <Typography variant="body2" sx={{ mr: 2 }}>Arquivo atual: {formData.current_file_name}</Typography>
                            </Box>
                        )}
                        {uploading && <CircularProgress size={24} sx={{ ml: 2, mt:1 }} />}
                    </Grid>
                     <Grid item xs={12}>
                        <TextField name="notes" label="Notas Adicionais" value={formData.notes || ""} onChange={handleChange} fullWidth multiline rows={2} />
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={() => navigate("/documents")} sx={{ mr: 2 }} disabled={loading || uploading}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={loading || uploading || !formData.entity_type || !formData.entity_id}>
                            {loading || uploading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? "Atualizar Documento" : "Salvar Documento")}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default DocumentForm;

