import { createClient } from "@supabase/supabase-js"

// Verificar se estamos no ambiente de build (Vercel/CI) ou em ambiente de desenvolvimento
const isBuildTime = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && typeof window === 'undefined';

// Use valores padrão durante o build para evitar erros
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isBuildTime ? 'https://placeholder-url.supabase.co' : '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isBuildTime ? 'placeholder-key' : '');

// Criar cliente Supabase apenas se tivermos as credenciais ou se for tempo de build
export const supabase = createClient(supabaseUrl, supabaseKey);

let dbInitialized = false;

// Função para criar as tabelas necessárias
export async function setupDatabase() {
  // Skip initialization during build time
  if (isBuildTime) {
    console.log("Ambiente de build detectado, pulando inicialização do banco de dados.")
    return true;
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

