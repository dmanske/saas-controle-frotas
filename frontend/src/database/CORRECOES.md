# Correções e Processo de Implementação

## Problema Encontrado
O script de manutenções apresentou o erro:
```
ERROR: 42P01: relation "public.tenants" does not exist
```

Este erro ocorreu porque o script tentava criar uma chave estrangeira (`FOREIGN KEY`) referenciando a tabela `public.tenants`, que ainda não existia no banco de dados.

## Solução Implementada

### 1. Criação da Tabela Tenants
Primeiro, criamos a tabela `tenants` com a seguinte estrutura:
```sql
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
```

### 2. Criação da Função get_current_tenant_id
Em seguida, criamos a função necessária para as políticas RLS:
```sql
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_tenant_id UUID;
BEGIN
    current_tenant_id := (auth.jwt() ->> 'tenant_id')::UUID;
    IF current_tenant_id IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN current_tenant_id;
END;
$$;
```

### 3. Ordem de Execução dos Scripts
Para garantir o funcionamento correto, os scripts devem ser executados na seguinte ordem:

1. `tenants.sql` - Cria a tabela de tenants
2. `functions.sql` - Cria a função get_current_tenant_id
3. `maintenances.sql` - Cria a tabela de manutenções

## Explicação das Dependências

1. **Dependência da Tabela Tenants**
   - A tabela `maintenances` tem uma chave estrangeira (`tenant_id`) que referencia a tabela `tenants`
   - Por isso, a tabela `tenants` precisa existir primeiro

2. **Dependência da Função get_current_tenant_id**
   - As políticas RLS da tabela `maintenances` usam esta função
   - A função precisa existir antes das políticas serem criadas

## Políticas de Segurança Implementadas

1. **Tabela Tenants**
   - SELECT: Todos os usuários autenticados podem ver
   - INSERT: Usuários autenticados podem inserir
   - UPDATE: Usuários autenticados podem atualizar
   - DELETE: Usuários autenticados podem deletar

2. **Tabela Maintenances**
   - Todas as operações são restritas ao tenant_id do usuário atual
   - Usa a função `get_current_tenant_id()` para verificar permissões

## Como Executar os Scripts

1. Acesse o painel do Supabase
2. Vá para a seção "SQL Editor"
3. Execute os scripts na ordem mencionada acima
4. Verifique se não há erros na execução

## Observações Importantes

1. **Multi-tenancy**
   - O sistema está preparado para suportar múltiplos tenants
   - Cada tenant tem seus próprios veículos e manutenções
   - As políticas RLS garantem isolamento entre tenants

2. **Segurança**
   - Todas as tabelas têm RLS habilitado
   - As políticas garantem que usuários só acessem dados do seu tenant
   - A função `get_current_tenant_id` é `SECURITY DEFINER` para garantir segurança

3. **Manutenção**
   - Os campos `created_at` e `updated_at` são atualizados automaticamente
   - Índices foram criados para otimizar consultas comuns
   - Constraints garantem integridade dos dados 