import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/toaster"
import { SupabaseError } from "@/components/supabase-error"
import { SupabaseProvider } from "@/lib/supabase-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shopee Page Control - o controle da shopee external",
  description: "Sistema interno para controle de horas extras e ausências",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        <Toaster />
        <SupabaseError />
      </body>
    </html>
  )
}



import './globals.css'