'use client'
import { useEffect, useState } from 'react'
import { api, ErroAPI } from '@/lib/api'

type Fornecedor = {
  id: string; nome: string; email: string; telefone?: string
  verificado: boolean; suspenso: boolean; total_vendas: number
  pecas_activas: string; total_pedidos: string; tipo: string
  avaliacao_media: string; criado_em: string
}

export default function PaginaFornecedoresAdmin() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState<string | null>(null)

  useEffect(() => {
    api.admin.fornecedores()
      .then(d => setFornecedores(d as Fornecedor[]))
      .finally(() => setCarregando(false))
  }, [])

  async function toggleSuspender(f: Fornecedor) {
    const acao = f.suspenso ? 'reactivar' : 'suspender'
    const motivo = f.suspenso ? undefined : prompt(`Motivo para suspender ${f.nome}:`) ?? undefined
    if (!f.suspenso && motivo === undefined) return

    setAtualizando(f.id)
    try {
      await api.admin.suspenderFornecedor(f.id, { suspenso: !f.suspenso, motivo })
      setFornecedores(prev => prev.map(x => x.id === f.id ? { ...x, suspenso: !f.suspenso } : x))
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : `Erro ao ${acao}`)
    } finally {
      setAtualizando(null)
    }
  }

  async function reporPassword(f: Fornecedor) {
    const novaPwd = prompt(`Nova password para ${f.nome}:\n(mínimo 8 caracteres)`)
    if (!novaPwd) return
    if (novaPwd.length < 8) {
      alert('A password deve ter pelo menos 8 caracteres')
      return
    }
    try {
      // O endpoint usa o id do utilizador (não do fornecedor)
      // A API /admin/fornecedores devolve o campo fornecedor_id separado — aqui usamos o id do utilizador
      // que está no campo implícito; vamos usar a rota com o id do utilizador via /admin/usuarios
      // Nota: o id em Fornecedor é o id do perfil de fornecedor; para reset de password precisamos do id do utilizador.
      // A API /admin/fornecedores devolve u.id implicitamente via JOIN — mas o tipo não inclui usuario_id.
      // Usamos /admin/usuarios?q=email para obter o id, ou pedimos directamente pelo email via endpoint genérico.
      // Solução: chamar a rota com o fornecedor_id (o backend procura pelo id do utilizador via JOIN)
      // O endpoint PUT /admin/usuarios/:id/reset-password usa o id do utilizador — precisamos do usuario_id.
      // A página não tem usuario_id no tipo. Vamos buscar via /admin/usuarios pesquisando pelo email.
      const todosUsers = await api.admin.usuarios(f.email) as Array<{ id: string; email: string }>
      const user = todosUsers.find(u => u.email === f.email)
      if (!user) { alert('Utilizador não encontrado'); return }
      const res = await api.admin.resetarPassword(user.id, novaPwd) as { mensagem: string }
      alert(res.mensagem)
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao repor password')
    }
  }

  if (carregando) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-xl font-bold text-[#111111]">Fornecedores ({fornecedores.length})</h1>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
        {fornecedores.map(f => (
          <div key={f.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#dc2626] flex items-center justify-center text-white font-bold shrink-0">
              {f.nome.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-[#111111] truncate">{f.nome}</p>
                {f.verificado && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Verificado</span>}
                {f.suspenso  && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Suspenso</span>}
              </div>
              <p className="text-sm text-gray-500">{f.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {f.pecas_activas} peças · {f.total_pedidos} pedidos · {f.total_vendas} vendas
                {f.avaliacao_media && Number(f.avaliacao_media) > 0 && ` · ⭐ ${Number(f.avaliacao_media).toFixed(1)}`}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => toggleSuspender(f)}
                disabled={atualizando === f.id}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                  f.suspenso
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                }`}
              >
                {atualizando === f.id ? '…' : f.suspenso ? 'Reactivar' : 'Suspender'}
              </button>
              <button
                onClick={() => reporPassword(f)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                Repor password
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
