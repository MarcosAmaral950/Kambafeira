'use client'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { api, tokenStore } from './api'

type Usuario = {
  id: string
  nome: string
  email: string
  perfil: 'admin' | 'fornecedor' | 'comprador'
}

type AuthContexto = {
  usuario: Usuario | null
  carregando: boolean
  sair: () => Promise<void>
  recarregar: () => Promise<void>
}

const AuthContexto = createContext<AuthContexto>({
  usuario: null,
  carregando: true,
  sair: async () => {},
  recarregar: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    // Sem token em localStorage não vale a pena chamar /auth/me
    if (!tokenStore.get()) {
      setUsuario(null)
      setCarregando(false)
      return
    }
    try {
      const dados = await api.auth.me() as Usuario
      setUsuario(dados)
    } catch {
      setUsuario(null)
      tokenStore.clear()
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  async function sair() {
    try { await api.auth.logout() } catch {}
    setUsuario(null)
    window.location.href = '/'
  }

  return (
    <AuthContexto.Provider value={{ usuario, carregando, sair, recarregar }}>
      {children}
    </AuthContexto.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContexto)
}
