import { Vehicle } from "./vehicle"; // Assumindo que você tem um tipo Vehicle

export type MaintenanceStatusType = 'agendada' | 'em andamento' | 'concluída' | 'cancelada' | 'pendente';
export type MaintenanceCategoryType = 'preventiva' | 'corretiva' | 'preditiva' | 'melhoria' | 'outra';

export interface Maintenance {
  id: string;
  created_at: string;
  tenant_id: string;
  vehicle_id: string;
  maintenance_type: MaintenanceCategoryType;
  description: string;
  scheduled_date?: string;
  completion_date?: string;
  cost_parts?: number;
  cost_services?: number;
  total_cost?: number;
  supplier_name?: string;
  status: MaintenanceStatusType;
  notes?: string;
  vehicle?: {
    plate: string;
    brand: string;
    model: string;
  };
}

// Para o formulário, podemos ter uma interface ligeiramente diferente
export interface MaintenanceFormData {
  id?: string;
  vehicle_id: string;
  maintenance_type: MaintenanceCategoryType;
  description: string;
  scheduled_date?: string | null;
  completion_date?: string | null;
  cost_parts?: string; // Usar string para inputs de formulário
  cost_services?: string;
  supplier_name?: string | null;
  status: MaintenanceStatusType;
  notes?: string | null;
}

