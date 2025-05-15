export interface Vehicle {
  id?: string; // UUID gerado pelo Supabase
  tenant_id: string;
  plate: string;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  type: 'car' | 'truck' | 'motorcycle' | 'machine'; // Adicionando 'machine'
  current_km: number;
  next_maintenance_date?: string | null;
  document_due_date?: string | null; // Vencimento do documento
  status: 'active' | 'maintenance' | 'inactive' | 'sold';
  created_at?: string;
  // Campos adicionais das funcionalidades que aprovamos
  fuel_type?: 'gasoline' | 'diesel' | 'ethanol' | 'electric' | 'gas' | 'flex';
  average_consumption?: number; // km/l ou l/h para máquinas
  chassis?: string;
  renavam?: string;
  purchase_date?: string | null;
  purchase_price?: number;
  notes?: string;
  // Para controle de pneus (ideia adicional 3)
  tire_details?: string; // Poderia ser um JSON ou referência a outra tabela
  // Para TCO (ideia adicional 5)
  // Outros custos podem ser calculados a partir de manutenções, abastecimentos, etc.
}

export interface VehicleExpense {
  id?: string;
  vehicle_id: string;
  tenant_id: string;
  expense_type: 'maintenance' | 'fuel' | 'document' | 'tire' | 'insurance' | 'fine' | 'other';
  description: string;
  date: string;
  amount: number;
  created_at?: string;
  // Campos específicos para tipos de despesa
  km_at_expense?: number;
  liters_fueled?: number; // Para abastecimento
  service_provider?: string; // Para manutenção/oficina
  invoice_number?: string;
}

