-- Criação da tabela vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    plate VARCHAR(10) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year_manufacture INTEGER,
    year_model INTEGER,
    type VARCHAR(50) DEFAULT 'car',
    current_km NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    fuel_type VARCHAR(50) DEFAULT 'flex',
    chassis VARCHAR(50),
    renavam VARCHAR(50),
    next_maintenance_date DATE,
    document_due_date DATE,
    purchase_date DATE,
    purchase_price NUMERIC,
    average_consumption NUMERIC,
    tire_details TEXT,
    notes TEXT,
    tenant_id UUID,
    CONSTRAINT vehicles_plate_key UNIQUE (plate)
);

-- Criação de índices
CREATE INDEX IF NOT EXISTS vehicles_tenant_id_idx ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS vehicles_plate_idx ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS vehicles_status_idx ON public.vehicles(status);

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ver veículos"
    ON public.vehicles
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir veículos"
    ON public.vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar veículos"
    ON public.vehicles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política para permitir deleção para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar veículos"
    ON public.vehicles
    FOR DELETE
    TO authenticated
    USING (true);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 