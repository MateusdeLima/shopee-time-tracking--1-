import { NextResponse } from "next/server"
import { createTablesApi } from "@/lib/setup-database-api"

export async function GET() {
  try {
    console.log("Iniciando configuração do banco de dados via API...")
    const success = await createTablesApi()

    if (success) {
      console.log("Banco de dados configurado com sucesso via API!")
      return NextResponse.json({ success: true, message: "Banco de dados configurado com sucesso!" })
    } else {
      console.error("Falha ao configurar banco de dados via API.")
      return NextResponse.json({ success: false, message: "Falha ao configurar banco de dados." }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao configurar banco de dados via API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao configurar banco de dados.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

