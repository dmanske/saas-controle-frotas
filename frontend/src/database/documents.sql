-- Criação da tabela documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tenant_id UUID NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    custom_document_type_description TEXT,
    description TEXT,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    issuing_authority VARCHAR(255),
    document_number VARCHAR(100),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    notes TEXT,
    CONSTRAINT documents_entity_type_check CHECK (entity_type IN ('vehicle', 'driver'))
);

-- Criação de índices
CREATE INDEX IF NOT EXISTS documents_tenant_id_idx ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS documents_entity_type_idx ON public.documents(entity_type);
CREATE INDEX IF NOT EXISTS documents_entity_id_idx ON public.documents(entity_id);
CREATE INDEX IF NOT EXISTS documents_expiration_date_idx ON public.documents(expiration_date);

-- Função para extrair tenant_id do JWT
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_id_str TEXT;
BEGIN
    tenant_id_str := (auth.jwt() ->> 'user_metadata')::jsonb->>'tenant_id';
    RETURN tenant_id_str::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver documentos do seu tenant" ON public.documents;
DROP POLICY IF EXISTS "Usuários podem inserir documentos no seu tenant" ON public.documents;
DROP POLICY IF EXISTS "Usuários podem atualizar documentos do seu tenant" ON public.documents;
DROP POLICY IF EXISTS "Usuários podem deletar documentos do seu tenant" ON public.documents;
DROP POLICY IF EXISTS "Política de tenant para documentos" ON public.documents;
DROP POLICY IF EXISTS "Permitir todas as operações temporariamente" ON public.documents;

-- Habilitar RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Criar políticas usando a função get_tenant_id
CREATE POLICY "Política de tenant para documentos"
    ON public.documents
    FOR ALL
    TO authenticated
    USING (tenant_id = get_tenant_id())
    WITH CHECK (tenant_id = get_tenant_id());

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
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Criar bucket para arquivos de documentos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('document_files', 'document_files', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança para o bucket document_files
CREATE POLICY "Usuários podem ver arquivos do seu tenant"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'document_files' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'user_metadata')::jsonb->>'tenant_id');

CREATE POLICY "Usuários podem inserir arquivos no seu tenant"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'document_files' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'user_metadata')::jsonb->>'tenant_id');

CREATE POLICY "Usuários podem atualizar arquivos do seu tenant"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'document_files' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'user_metadata')::jsonb->>'tenant_id')
    WITH CHECK (bucket_id = 'document_files' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'user_metadata')::jsonb->>'tenant_id');

CREATE POLICY "Usuários podem deletar arquivos do seu tenant"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'document_files' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'user_metadata')::jsonb->>'tenant_id'); 