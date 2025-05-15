export type CnhCategoryType =  'A' | 'B' | 'AB' | 'C' | 'D' | 'E' | 'ACC';
export type DriverStatusType = 'ativo' | 'inativo' | 'férias' | 'afastado' | 'desligado';

export interface DriverAddress {
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null; // UF
}

export interface Driver {
  id?: string; // UUID, gerado pelo Supabase
  created_at?: string; // Timestamp, gerado pelo Supabase
  tenant_id: string; // UUID, do tenant
  name: string;
  cpf: string; // Pode precisar de máscara e validação
  birth_date: string; // Formato YYYY-MM-DD
  phone: string; // Pode precisar de máscara
  email?: string | null;
  profile_picture_url?: string | null;
  
  cnh_number: string;
  cnh_category: CnhCategoryType;
  cnh_expiration_date: string; // Formato YYYY-MM-DD
  
  admission_date: string; // Formato YYYY-MM-DD
  status: DriverStatusType;
  
  address?: DriverAddress | null; // Pode ser um objeto JSONB no Supabase
  
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null; // Pode precisar de máscara
  
  notes?: string | null;
}

// Para o formulário, podemos ter uma interface ligeiramente diferente
// especialmente para campos que são strings no input e precisam ser convertidos
export interface DriverFormData {
  id?: string;
  name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email?: string | null;
  profile_picture_url?: string | null;
  
  cnh_number: string;
  cnh_category: CnhCategoryType;
  cnh_expiration_date: string;
  
  admission_date: string;
  status: DriverStatusType;
  
  // Endereço como campos separados no formulário para melhor UX
  address_cep?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  
  notes?: string | null;
}

