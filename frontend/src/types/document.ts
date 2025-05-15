import { Vehicle } from "./vehicle"; // Ajustar caminho se necessário, ex: ../vehicle ou ./vehicle
import { Driver } from "./driver";   // Ajustar caminho se necessário, ex: ../driver ou ./driver

export type DocumentEntityType = "vehicle" | "driver";
export type DocumentStatus = "válido" | "próximo_vencimento" | "vencido" | "não_aplicável";

// Tipos de documentos comuns, podem ser expandidos
export type KnownDocumentType = 
  | "CNH" 
  | "CRLV" 
  | "Apólice de Seguro" 
  | "Certificado de Inspeção Veicular"
  | "Certificado de Curso"
  | "Comprovante de Endereço"
  | "RG"
  | "CPF"
  | "Outro";

export interface DocumentMetadata {
  id?: string; // UUID, gerado pelo Supabase
  created_at?: string; // Timestamp, gerado pelo Supabase
  tenant_id: string; // UUID, do tenant
  
  document_name: string; // Nome descritivo dado pelo usuário
  document_type: KnownDocumentType | string; // Tipo do documento (pode ser um dos conhecidos ou um string livre se "Outro")
  custom_document_type_description?: string | null; // Descrição se document_type for "Outro"
  description?: string | null; // Descrição/observações sobre o documento
  
  entity_type: DocumentEntityType; // "vehicle" ou "driver"
  entity_id: string; // ID do veículo ou motorista associado
  vehicle_id?: string | null; // ID do veículo (se entity_type for 'vehicle')
  driver_id?: string | null; // ID do motorista (se entity_type for 'driver')
  
  issue_date?: string | null; // Data de emissão (Formato YYYY-MM-DD)
  expiration_date?: string | null; // Data de validade (Formato YYYY-MM-DD)
  issuing_authority?: string | null; // Órgão emissor
  document_number?: string | null; // Número oficial do documento
  
  file_url?: string | null; // URL do arquivo no Supabase Storage
  file_name?: string | null; // Nome original do arquivo que foi feito upload
  file_size?: number | null; // Tamanho do arquivo em bytes
  file_type?: string | null; // MIME type do arquivo

  notes?: string | null;

  // Campos que podem ser populados no frontend para exibição
  vehicle_plate?: string | null; // Se entity_type for "vehicle"
  driver_name?: string | null;   // Se entity_type for "driver"
  status_validity?: DocumentStatus;
}

export interface DocumentFormData {
  id?: string;
  document_name: string;
  document_type: KnownDocumentType | string;
  custom_document_type_description?: string | null;
  description?: string | null;
  
  entity_type: DocumentEntityType | 
  ""; // Permitir string vazia para estado inicial do formulário
  entity_id: string | ""; // Permitir string vazia para estado inicial do formulário
  
  issue_date?: string | null;
  expiration_date?: string | null;
  issuing_authority?: string | null;
  document_number?: string | null;
  
  file_to_upload?: File | null; // Arquivo para ser enviado
  current_file_name?: string | null; // Nome do arquivo existente (para edição)
  remove_current_file?: boolean; // Flag para remover arquivo existente na edição

  notes?: string | null;
}

