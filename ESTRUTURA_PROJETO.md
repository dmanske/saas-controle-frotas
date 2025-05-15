# Estrutura do Projeto Frontend

## Visão Geral
Este documento descreve a organização do projeto frontend, detalhando a estrutura de pastas, arquivos principais e suas responsabilidades.

## Estrutura de Diretórios

```
frontend/src/
├── components/         # Componentes reutilizáveis
├── contexts/          # Contextos da aplicação (AuthContext, etc)
├── database/          # Configurações e tipos relacionados ao banco de dados
├── layouts/           # Layouts reutilizáveis (MainLayout, etc)
├── pages/            # Páginas principais da aplicação
├── services/         # Serviços e configurações (Supabase, etc)
├── types/            # Definições de tipos TypeScript
└── utils/            # Funções utilitárias
```

## Descrição das Pastas Principais

### `/components`
Componentes reutilizáveis da aplicação, como:
- `VehicleForm.tsx` - Formulário de cadastro/edição de veículos
- `VehicleList.tsx` - Lista de veículos
- `MaintenanceForm.tsx` - Formulário de manutenções
- `MaintenanceList.tsx` - Lista de manutenções
- `FuelForm.tsx` - Formulário de abastecimentos
- `FuelList.tsx` - Lista de abastecimentos

### `/contexts`
Contextos React para gerenciamento de estado global:
- `AuthContext.tsx` - Contexto de autenticação
- `TenantContext.tsx` - Contexto do tenant atual

### `/database`
Configurações e tipos relacionados ao banco de dados:
- `schema.ts` - Definição do schema do banco
- `types.ts` - Tipos relacionados ao banco

### `/layouts`
Layouts reutilizáveis da aplicação:
- `MainLayout.tsx` - Layout principal com menu lateral
- `AuthLayout.tsx` - Layout para páginas de autenticação

### `/pages`
Páginas principais da aplicação:
- `VehiclesPage.tsx` - Página de gestão de veículos
- `MaintenancePage.tsx` - Página de gestão de manutenções
- `FuelPage.tsx` - Página de gestão de abastecimentos
- `DriversPage.tsx` - Página de gestão de motoristas

### `/services`
Serviços e configurações:
- `supabase.ts` - Configuração do cliente Supabase
- `auth.ts` - Serviços de autenticação
- `vehicle.ts` - Serviços relacionados a veículos
- `maintenance.ts` - Serviços relacionados a manutenções
- `fuel.ts` - Serviços relacionados a abastecimentos

### `/types`
Definições de tipos TypeScript:
- `vehicle.ts` - Tipos relacionados a veículos
- `maintenance.ts` - Tipos relacionados a manutenções
- `fuel.ts` - Tipos relacionados a abastecimentos
- `driver.ts` - Tipos relacionados a motoristas

## Arquivos Principais

### Configuração do Supabase
```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../database/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### Contexto de Autenticação
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { User } from '@supabase/supabase-js'

// ... implementação do contexto
```

## Padrões de Importação

### Importando do Supabase
```typescript
import { supabase } from '../services/supabase'
```

### Importando Tipos
```typescript
import { Vehicle, Maintenance, Fuel, Driver } from '../types'
```

### Importando Contextos
```typescript
import { useAuth } from '../contexts/AuthContext'
```

## Convenções

1. **Nomenclatura de Arquivos**:
   - Componentes: PascalCase (ex: `VehicleForm.tsx`)
   - Serviços: camelCase (ex: `vehicle.ts`)
   - Tipos: camelCase (ex: `vehicle.ts`)

2. **Organização de Componentes**:
   - Cada componente em seu próprio arquivo
   - Componentes relacionados agrupados em subpastas

3. **Importações**:
   - Usar caminhos relativos
   - Agrupar imports por tipo (React, MUI, serviços, etc)

4. **Tipos**:
   - Definir interfaces/types em arquivos separados
   - Usar tipos do Supabase quando possível

## Observações Importantes

1. Todos os arquivos de serviço, contexto e tipos devem estar dentro da pasta `src/`
2. Evitar importações circulares
3. Manter a consistência na estrutura de pastas
4. Documentar componentes e funções complexas
5. Seguir as convenções de código estabelecidas 