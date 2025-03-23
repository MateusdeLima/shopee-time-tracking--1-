"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

type SupabaseContextType = {
  supabase: SupabaseClient | null
  isLoading: boolean
  isError: boolean
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  isError: false,
})

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey)
      setSupabaseClient(client)
      setIsLoading(false)
    } else {
      console.error("Variáveis de ambiente do Supabase não configuradas")
      setIsError(true)
      setIsLoading(false)
    }
  }, [])

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, isLoading, isError }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase deve ser usado dentro de um SupabaseProvider")
  }
  return context
} 