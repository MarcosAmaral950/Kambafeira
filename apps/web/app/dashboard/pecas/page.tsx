'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { api, ErroAPI } from '@/lib/api'

type Peca = {
  id: string; titulo: string; preco: string; status: string
  estoque: number; condicao: string; foto_principal?: string
  marca_veiculo?: string; modelo_veiculo?: string; criada_em: string
}

// Cor do badge de status
const COR_STATUS: Record<string, string> = {
  activo:   'bg-green-100 text-green-800',
  rascunho: 'bg-gray-100 text-gray-600',
  suspenso: 'bg-yellow-100 text-yellow-800',
  vendido:  'bg-blue-100 text-blue-800',
  removido: 'bg-red-100 text-red-800',
}

// Cor do indicador de estoque baixo
function corEstoque(estoque: number): string {
  if (estoque === 0) return 'text-red-600 font-semibold'
  if (estoque <= 2)  return 'text-orange-500 font-semibold'
  return 'text-gray-600'
}

// Componente de edição inline de campo numérico (estoque ou preço)
function CampoInline({
  valor,
  tipo,
  aoConfirmar,
  aoCancelar,
}: {
  valor: number
  tipo: 'estoque' | 'preco'
  aoConfirmar: (novoValor: number) => void
  aoCancelar: () => void
}) {
  const [valorLocal, setValorLocal] = useState(String(valor))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  function confirmar() {
    const num = tipo === 'estoque' ? parseInt(valorLocal) : parseFloat(valorLocal)
    if (isNaN(num) || num < 0) return
    aoConfirmar(num)
  }

  function tecla(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  confirmar()
    if (e.key === 'Escape') aoCancelar()
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        value={valorLocal}
        onChange={e => setValorLocal(e.target.value)}
        onKeyDown={tecla}
        min={0}
        step={tipo === 'preco' ? 'any' : 1}
        className="w-20 px-1.5 py-0.5 text-sm border border-[#dc2626] rounded focus:outline-none"
      />
      <button
        onClick={confirmar}
        className="text-green-600 hover:text-green-800 text-base leading-none"
        title="Confirmar"
      >
        ✓
      </button>
      <button
        onClick={aoCancelar}
        className="text-gray-400 hover:text-gray-600 text-base leading-none"
        title="Cancelar"
      >
        ✗
      </button>
    </span>
  )
}

export default function PaginaPecasFornecedor() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [carregando, setCarregando] = useState(true)
  const [removendo, setRemovendo] = useState<string | null>(null)

  // Estado para controlar qual campo de qual peça está em edição inline
  const [editandoEstoque, setEditandoEstoque] = useState<string | null>(null)
  const [editandoPreco, setEditandoPreco]   = useState<string | null>(null)
  // Estado para guardar peças a actualizar (evitar re-carregamento total)
  const [aActualizar, setAActualizar] = useState<string | null>(null)

  async function carregar() {
    try {
      const dados = await api.pecas.minhas() as Peca[]
      setPecas(dados)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function remover(id: string, titulo: string) {
    if (!confirm(`Remover "${titulo}"? Esta acção não pode ser desfeita.`)) return
    setRemovendo(id)
    try {
      await api.pecas.remover(id)
      setPecas(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao remover peça')
    } finally {
      setRemovendo(null)
    }
  }

  // Actualização rápida de um campo
  async function actualizarRapido(
    id: string,
    dados: { estoque?: number; preco?: number; status?: string }
  ) {
    setAActualizar(id)
    try {
      const resultado = await api.pecas.atualizarRapido(id, dados) as { estoque: number; preco: string; status: string }
      setPecas(prev => prev.map(p =>
        p.id === id
          ? { ...p, estoque: resultado.estoque, preco: resultado.preco, status: resultado.status }
          : p
      ))
    } catch (err) {
      alert(err instanceof ErroAPI ? err.message : 'Erro ao actualizar')
    } finally {
      setAActualizar(null)
    }
  }

  // Toggle rápido activo ↔ rascunho
  async function toggleAtivo(peca: Peca) {
    const novoStatus = peca.status === 'activo' ? 'rascunho' : 'activo'
    await actualizarRapido(peca.id, { status: novoStatus })
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">As minhas peças</h1>
        <Link
          href="/dashboard/pecas/nova"
          className="bg-[#dc2626] text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          + Nova Peça
        </Link>
      </div>

      {pecas.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-gray-500 mb-4">Ainda não publicaste nenhuma peça</p>
          <Link href="/dashboard/pecas/nova" className="text-[#dc2626] font-medium hover:underline">
            Publicar a primeira peça →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {pecas.map(peca => {
            const emActualizacao = aActualizar === peca.id

            return (
              <div key={peca.id} className={`flex items-start gap-3 p-4 transition-opacity ${emActualizacao ? 'opacity-60' : ''}`}>
                {/* Foto */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {peca.foto_principal ? (
                    <Image
                      src={peca.foto_principal}
                      alt={peca.titulo}
                      width={64} height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🔧</div>
                  )}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#111111] truncate text-sm">{peca.titulo}</p>
                  {peca.marca_veiculo && (
                    <p className="text-xs text-gray-400">{peca.marca_veiculo}</p>
                  )}

                  {/* Linha: preço + estoque */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {/* Preço com edição inline */}
                    <span className="text-sm font-semibold text-[#dc2626]">
                      {editandoPreco === peca.id ? (
                        <CampoInline
                          valor={Number(peca.preco)}
                          tipo="preco"
                          aoConfirmar={novoPreco => {
                            setEditandoPreco(null)
                            actualizarRapido(peca.id, { preco: novoPreco })
                          }}
                          aoCancelar={() => setEditandoPreco(null)}
                        />
                      ) : (
                        <button
                          onClick={() => { setEditandoEstoque(null); setEditandoPreco(peca.id) }}
                          className="hover:underline decoration-dotted cursor-pointer"
                          title="Clica para editar o preço"
                          disabled={emActualizacao}
                        >
                          {Number(peca.preco).toLocaleString('pt-AO')} Kz
                        </button>
                      )}
                    </span>

                    {/* Estoque com edição inline */}
                    <span className={`text-xs ${corEstoque(peca.estoque)}`}>
                      {editandoEstoque === peca.id ? (
                        <CampoInline
                          valor={peca.estoque}
                          tipo="estoque"
                          aoConfirmar={novoEstoque => {
                            setEditandoEstoque(null)
                            actualizarRapido(peca.id, { estoque: novoEstoque })
                          }}
                          aoCancelar={() => setEditandoEstoque(null)}
                        />
                      ) : (
                        <button
                          onClick={() => { setEditandoPreco(null); setEditandoEstoque(peca.id) }}
                          className="hover:underline decoration-dotted cursor-pointer"
                          title="Clica para editar o estoque"
                          disabled={emActualizacao}
                        >
                          Est: {peca.estoque}
                          {peca.estoque === 0 && ' — Esgotado'}
                          {peca.estoque > 0 && peca.estoque <= 2 && ' — Baixo'}
                        </button>
                      )}
                    </span>
                  </div>

                  {/* Linha: badge status + toggle */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS[peca.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {peca.status.charAt(0).toUpperCase() + peca.status.slice(1)}
                    </span>

                    {/* Toggle activo/rascunho — só para estados que o permitem */}
                    {(peca.status === 'activo' || peca.status === 'rascunho') && (
                      <button
                        onClick={() => toggleAtivo(peca)}
                        disabled={emActualizacao}
                        className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-40 ${
                          peca.status === 'activo'
                            ? 'border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-700'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                        title={peca.status === 'activo' ? 'Passar a rascunho' : 'Activar'}
                      >
                        {peca.status === 'activo' ? '⏸ Pausar' : '▶ Activar'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Acções */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Link
                    href={`/dashboard/pecas/${peca.id}/editar`}
                    className="text-xs text-gray-600 hover:text-[#dc2626] px-2.5 py-1 rounded border border-gray-200 hover:border-[#dc2626] transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => remover(peca.id, peca.titulo)}
                    disabled={removendo === peca.id || emActualizacao}
                    className="text-xs text-red-500 hover:text-red-700 px-2.5 py-1 rounded border border-red-100 hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {removendo === peca.id ? '…' : 'Remover'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
