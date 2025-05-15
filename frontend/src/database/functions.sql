-- Função para obter o tenant_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    -- Obtém o tenant_id do usuário atual através do JWT
    current_tenant_id := (auth.jwt() ->> 'tenant_id')::UUID;
    
    -- Se não houver tenant_id no JWT, retorna NULL
    IF current_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN current_tenant_id;
END;
$$; 