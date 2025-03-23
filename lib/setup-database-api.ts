import { supabase } from "./supabase"

// Função para criar as tabelas via API REST do Supabase
export async function createTablesApi() {
  // Verificar se estamos no ambiente de build
  const isBuildTime = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && typeof window === 'undefined';
  
  if (isBuildTime) {
    // Durante o build, apenas retorne sucesso
    console.log("Ambiente de build detectado, pulando inicialização do banco de dados.")
    return true
  }
  
  try {
    console.log("Iniciando criação de tabelas via API...")

    // Como não podemos usar SQL diretamente, vamos tentar criar as tabelas usando a API
    // Vamos verificar se as tabelas já existem primeiro

    // Verificar tabela de usuários
    try {
      const { data: users, error } = await supabase.from("users").select("id").limit(1)
      
      if (error && error.code === "42P01") { // Código para "relation does not exist"
        console.log("Tabela users não existe. Por favor, crie manualmente usando o SQL Editor.")
      } else {
        console.log("Tabela users já existe ou verificação falhou.")
      }
    } catch (error) {
      console.error("Erro ao verificar tabela users:", error)
    }

    // Verificar tabela de feriados
    try {
      const { data: holidays, error } = await supabase.from("holidays").select("id").limit(1)
      
      if (error && error.code === "42P01") {
        console.log("Tabela holidays não existe. Por favor, crie manualmente usando o SQL Editor.")
      } else if (!error) {
        console.log("Tabela holidays já existe.")
        
        // Se a tabela existe mas está vazia, inserir feriados iniciais
        if (!holidays || holidays.length === 0) {
          const { error: insertError } = await supabase.from("holidays").insert([
            {
              name: "Natal",
              date: "2023-12-25",
              active: true,
              deadline: "2024-01-10",
              max_hours: 2,
            },
            {
              name: "Ano Novo",
              date: "2024-01-01",
              active: true,
              deadline: "2024-01-15",
              max_hours: 2,
            },
            {
              name: "Carnaval",
              date: "2024-02-13",
              active: true,
              deadline: "2024-02-28",
              max_hours: 2,
            },
          ])
          
          if (insertError) {
            console.error("Erro ao inserir feriados iniciais:", insertError)
          } else {
            console.log("Feriados iniciais inseridos com sucesso!")
          }
        }
      }
    } catch (error) {
      console.error("Erro ao verificar tabela holidays:", error)
    }

    // Verificar tabela de horas extras
    try {
      const { error } = await supabase.from("overtime_records").select("id").limit(1)
      
      if (error && error.code === "42P01") {
        console.log("Tabela overtime_records não existe. Por favor, crie manualmente usando o SQL Editor.")
      } else {
        console.log("Tabela overtime_records já existe ou verificação falhou.")
      }
    } catch (error) {
      console.error("Erro ao verificar tabela overtime_records:", error)
    }

    // Verificar tabela de registros de ponto
    try {
      const { error } = await supabase.from("time_clock_records").select("id").limit(1)
      
      if (error && error.code === "42P01") {
        console.log("Tabela time_clock_records não existe. Por favor, crie manualmente usando o SQL Editor.")
      } else {
        console.log("Tabela time_clock_records já existe ou verificação falhou.")
      }
    } catch (error) {
      console.error("Erro ao verificar tabela time_clock_records:", error)
    }

    // Verificar tabela de ausências
    try {
      const { error } = await supabase.from("absence_records").select("id").limit(1)
      
      if (error && error.code === "42P01") {
        console.log("Tabela absence_records não existe. Por favor, crie manualmente usando o SQL Editor.")
      } else {
        console.log("Tabela absence_records já existe ou verificação falhou.")
      }
    } catch (error) {
      console.error("Erro ao verificar tabela absence_records:", error)
    }

    console.log("Verificação de tabelas concluída!")
    console.log("Se alguma tabela não existe, execute o script SQL manualmente no Supabase SQL Editor.")
    console.log("O script está disponível em sql/setup-tables.sql")
    
    return true
  } catch (error) {
    console.error("Erro ao verificar tabelas:", error)
    return false
  }
} 