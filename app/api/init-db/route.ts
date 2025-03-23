import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  // Verificar se estamos no ambiente de build
  const isBuildTime = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && typeof window === 'undefined';
  
  if (isBuildTime) {
    // Durante o build, apenas retorne sucesso
    console.log("Ambiente de build detectado, pulando inicialização do banco de dados.")
    return NextResponse.json({ success: true, message: "Build mode - skipping database setup" })
  }
  
  try {
    console.log("Iniciando inicialização do banco de dados via API...")

    // Criar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variáveis de ambiente do Supabase não configuradas")
      return NextResponse.json({ 
        success: false, 
        message: "Variáveis de ambiente do Supabase não configuradas. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." 
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar tabelas e inserir dados iniciais
    const verifyAndSetup = async () => {
      try {
        console.log("Verificando tabelas existentes...")
        
        // Verificar tabelas existentes
        const tables = ["users", "holidays", "overtime_records", "time_clock_records", "absence_records"]
        const missingTables = []
        
        for (const table of tables) {
          try {
            const { error } = await supabase.from(table).select("id").limit(1)
            if (error && error.code === "42P01") {
              missingTables.push(table)
            }
          } catch (error) {
            console.error(`Erro ao verificar tabela ${table}:`, error)
          }
        }
        
        if (missingTables.length > 0) {
          console.log(`As seguintes tabelas não existem: ${missingTables.join(', ')}`)
          console.log("Por favor, execute o script SQL manualmente no Supabase SQL Editor.")
          console.log("O script está disponível em sql/setup-tables.sql")
          return false
        }
        
        // Verificar e inserir feriados iniciais
        const { data: holidays, error: holidaysError } = await supabase.from("holidays").select("id").limit(1)
        
        if (!holidaysError && (!holidays || holidays.length === 0)) {
          console.log("Inserindo feriados iniciais...")
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
        
        return true
      } catch (error) {
        console.error("Erro ao verificar e configurar banco de dados:", error)
        return false
      }
    }

    const success = await verifyAndSetup()

    if (success) {
      console.log("Banco de dados verificado com sucesso!")
      return NextResponse.json({ success: true, message: "Banco de dados verificado com sucesso!" })
    } else {
      console.error("Falha ao verificar banco de dados.")
      return NextResponse.json({ 
        success: false, 
        message: "Falha ao verificar banco de dados. Algumas tabelas podem estar faltando. Execute o script SQL manualmente." 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao inicializar banco de dados via API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao inicializar banco de dados.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

