"use client"

import { useEffect, useState } from "react"

export function SupabaseError() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window !== "undefined") {
      // Verificar se as variáveis de ambiente estão definidas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setShow(true)
      }
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Erro de Configuração</h2>
        <p className="mb-4">
          As variáveis de ambiente do Supabase não estão configuradas corretamente. Isso pode ocorrer pelos seguintes motivos:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>As variáveis de ambiente não estão definidas no Vercel</li>
          <li>As variáveis não foram aplicadas a todos os ambientes (Production, Preview, Development)</li>
          <li>O deploy foi feito sem as configurações necessárias</li>
        </ul>
        <p className="mb-4">
          Por favor, verifique as configurações no painel do Vercel e certifique-se de que as seguintes variáveis estão configuradas:
        </p>
        <ul className="list-disc pl-5 mb-4 text-sm font-mono bg-gray-100 p-2">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          <li>SUPABASE_SERVICE_ROLE_KEY</li>
        </ul>
        <p className="text-sm text-gray-600">
          Após configurar as variáveis, redeploy a aplicação no Vercel.
        </p>
      </div>
    </div>
  )
} 