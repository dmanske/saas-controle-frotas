import { Vehicle } from "./vehicle"; // Assumindo que você tem um tipo Vehicle

export const fuelTypeOptions = [
  { value: 'gasolina comum', label: 'Gasolina Comum' },
  { value: 'gasolina aditivada', label: 'Gasolina Aditivada' },
  { value: 'gasolina premium', label: 'Gasolina Premium' },
  { value: 'etanol hidratado', label: 'Etanol Hidratado' },
  { value: 'etanol aditivado', label: 'Etanol Aditivado' },
  { value: 'diesel comum', label: 'Diesel Comum (B)' },
  { value: 'diesel s10', label: 'Diesel S-10' },
  { value: 'diesel aditivado', label: 'Diesel Aditivado' },
  { value: 'gnv', label: 'Gás Natural Veicular (GNV)' },
  { value: 'elétrico', label: 'Elétrico' },
  { value: 'outro', label: 'Outro' }
];

export type FuelCategoryType =
  | 'gasolina comum'
  | 'gasolina aditivada'
  | 'gasolina premium'
  | 'etanol hidratado'
  | 'etanol aditivado'
  | 'diesel comum'
  | 'diesel s10'
  | 'diesel aditivado'
  | 'gnv'
  | 'elétrico'
  | 'outro';

export interface Supply {
  id: string;
  vehicle_id: string;
  supply_date: string;
  odometer_reading: number;
  fuel_type: FuelCategoryType;
  quantity_liters: number;
  price_per_unit: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  notes?: string;
  gas_station_name?: string;
  invoice_number?: string;
  driver_id?: string;
  vehicles?: Vehicle;
}

// Para o formulário, podemos ter uma interface ligeiramente diferente
export interface SupplyFormData {
  id?: string;
  vehicle_id: string;
  supply_date: string; // Data e hora
  odometer_reading: string; // Input como string, converter para número
  fuel_type: FuelCategoryType;
  quantity_liters: string; // Input como string
  price_per_unit: string; // Input como string
  gas_station_name?: string | null;
  invoice_number?: string | null;
  driver_id?: string | null;
  notes?: string | null;
}

