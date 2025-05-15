export interface Vehicle {
  id: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  plate: string;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  type: string;
  current_km: number;
  status: string;
  fuel_type: string;
  chassis?: string;
  renavam?: string;
  next_maintenance_date?: string;
  document_due_date?: string;
  purchase_date?: string;
  purchase_price?: number;
  average_consumption?: number;
  tire_details?: string;
  notes?: string;
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

