-- Criação da tabela tenants
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}'::jsonb
);

-- Criação de índices
CREATE INDEX IF NOT EXISTS tenants_document_idx ON public.tenants(document);
CREATE INDEX IF NOT EXISTS tenants_email_idx ON public.tenants(email);
CREATE INDEX IF NOT EXISTS tenants_status_idx ON public.tenants(status);

-- Habilitar RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários autenticados podem ver tenants"
    ON public.tenants
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuários autenticados podem inserir tenants"
    ON public.tenants
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar tenants"
    ON public.tenants
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar tenants"
    ON public.tenants
    FOR DELETE
    TO authenticated
    USING (true);

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 