-- Primeiro, remover qualquer policy existente para a tabela maintenances
DROP POLICY IF EXISTS "Usuários autenticados podem ver suas próprias manutenções" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir manutenções" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar manutenções" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar manutenções" ON public.maintenances;
DROP POLICY IF EXISTS "insert_tenantid" ON public.maintenances;
DROP POLICY IF EXISTS "tenantid_insert" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir manutenções do seu tenant" ON public.maintenances;

-- Recriar as policies com as permissões corretas
CREATE POLICY "Usuários podem ver suas próprias manutenções" 
ON public.maintenances 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem inserir manutenções" 
ON public.maintenances 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar manutenções" 
ON public.maintenances 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuários podem deletar manutenções" 
ON public.maintenances 
FOR DELETE 
TO authenticated 
USING (true);

-- Remover e recriar o gatilho RLS na tabela
ALTER TABLE public.maintenances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY; 