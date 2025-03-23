import { createClient } from "@supabase/supabase-js"

// Verificar se estamos no navegador
const isBrowser = typeof window !== 'undefined';

// Verificar se estamos no ambiente de build
const isBuildTime = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && !isBrowser;

// Use valores padrão durante o build para evitar erros
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente Supabase apenas se tivermos as credenciais
let supabase: ReturnType<typeof createClient>;

// Inicialização segura do cliente Supabase
if (!supabaseUrl || !supabaseKey) {
  // Criar um cliente simulado para evitar erros se as variáveis de ambiente não estiverem disponíveis
  if (isBrowser) {
    console.error('Erro: Variáveis de ambiente do Supabase não configuradas corretamente.');
    
    // Criando um objeto proxy que simula o cliente Supabase mas retorna promessas vazias
    const dummyResponse = { data: null, error: { message: "Configuração do Supabase ausente" } };
    
    supabase = new Proxy({} as ReturnType<typeof createClient>, {
      get: (target, prop) => {
        // Para métodos comuns do Supabase (from, auth, etc)
        if (typeof prop === 'string') {
          return new Proxy({}, {
            get: () => {
              // Retorna uma função que simula métodos encadeados
              return (..._args: any[]) => ({
                select: () => Promise.resolve(dummyResponse),
                insert: () => Promise.resolve(dummyResponse),
                update: () => Promise.resolve(dummyResponse),
                delete: () => Promise.resolve(dummyResponse),
                eq: () => Promise.resolve(dummyResponse),
                single: () => Promise.resolve(dummyResponse),
                limit: () => Promise.resolve(dummyResponse),
                then: (callback: any) => Promise.resolve(dummyResponse).then(callback),
                catch: (callback: any) => Promise.resolve(dummyResponse).catch(callback),
              })
            }
          });
        }
        return () => Promise.resolve(dummyResponse);
      }
    });
  } else {
    // No ambiente de servidor, criar um cliente com valores vazios (será recriado em cada requisição)
    supabase = createClient('https://placeholder-url.supabase.co', 'placeholder-key');
  }
} else {
  // Criar o cliente real se as variáveis estiverem disponíveis
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

let dbInitialized = false;

// Função para criar as tabelas necessárias
export async function setupDatabase() {
  // Skip initialization during build time
  if (isBuildTime) {
    console.log("Ambiente de build detectado, pulando inicialização do banco de dados.")
    return true;
  }
  
  // Skip if no valid configuration
  if (!supabaseUrl || !supabaseKey) {
    console.error("Variáveis de ambiente Supabase não configuradas. Pulando inicialização do banco de dados.");
    return false;
  }
  
  if (dbInitialized) {
    console.log("Banco de dados já inicializado, pulando configuração.")
    return true
  }

  try {
    console.log("Iniciando configuração do banco de dados...")

    // Verificar se as tabelas já existem
    try {
      const { data, error } = await supabase.from("users").select("id").limit(1)

      if (!error) {
        console.log("Tabelas já existem, pulando criação.")
        dbInitialized = true
        return true
      }
    } catch (e) {
      console.log("Erro ao verificar tabelas existentes:", e)
    }

    // Tentar criar tabelas usando a API
    const { createTablesApi } = await import("./setup-database-api")
    const success = await createTablesApi()

    if (success) {
      console.log("Configuração do banco de dados concluída com sucesso!")
      dbInitialized = true
    } else {
      console.error("Falha na configuração do banco de dados.")
    }

    return success
  } catch (error) {
    console.error("Erro ao configurar banco de dados:", error)
    return false
  }
}

