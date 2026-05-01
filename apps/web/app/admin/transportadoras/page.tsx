'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

const PROVINCIAS = [
  'Luanda','Benguela','Huambo','Cabinda','Huíla','Malanje','Namibe','Uíge',
  'Bié','Moxico','Lunda Norte','Lunda Sul','Kwanza Norte','Kwanza Sul',
  'Cunene','Zaire','Bengo','Cuando Cubango',
]

interface Zona {
  id: string
  provincia_origem: string
  provincia_destino: string
  preco_base: number
  preco_por_kg: number
  preco_por_km: number
  distancia_km: number
  ativa: boolean
}

interface Transportadora {
  id: string
  nome: string
  contato: string | null
  telefone: string | null
  whatsapp: string | null
  ativa: boolean
  criada_em: string
  zonas: Zona[]
}

const FORM_VAZIO_TRANSPORTADORA = { nome: '', contato: '', telefone: '', whatsapp: '', ativa: true }
const FORM_VAZIO_ZONA = {
  provincia_origem: 'Luanda', provincia_destino: 'Benguela',
  preco_base: 0, preco_por_kg: 0, preco_por_km: 0, distancia_km: 0, ativa: true,
}

export default function PaginaAdminTransportadoras() {
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  // Formulário nova transportadora
  const [mostrarFormT, setMostrarFormT] = useState(false)
  const [editandoT, setEditandoT] = useState<Transportadora | null>(null)
  const [formT, setFormT] = useState(FORM_VAZIO_TRANSPORTADORA)
  const [submetendoT, setSubmetendoT] = useState(false)

  // Formulário nova zona
  const [adicionandoZonaA, setAdicionandoZonaA] = useState<string | null>(null) // id da transportadora
  const [editandoZona, setEditandoZona] = useState<Zona | null>(null)
  const [formZ, setFormZ] = useState(FORM_VAZIO_ZONA)
  const [submetendoZ, setSubmetendoZ] = useState(false)

  async function carregar() {
    setCarregando(true)
    try {
      const dados = await api.transportadoras.admin.listar() as Transportadora[]
      setTransportadoras(dados)
    } catch {
      setErro('Erro ao carregar transportadoras')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirEditarT(t: Transportadora) {
    setEditandoT(t)
    setFormT({ nome: t.nome, contato: t.contato ?? '', telefone: t.telefone ?? '', whatsapp: t.whatsapp ?? '', ativa: t.ativa })
    setMostrarFormT(true)
  }

  function fecharFormT() {
    setMostrarFormT(false)
    setEditandoT(null)
    setFormT(FORM_VAZIO_TRANSPORTADORA)
  }

  async function submeterTransportadora(e: React.FormEvent) {
    e.preventDefault()
    setSubmetendoT(true)
    try {
      if (editandoT) {
        await api.transportadoras.admin.editar(editandoT.id, formT)
      } else {
        await api.transportadoras.admin.criar(formT)
      }
      fecharFormT()
      await carregar()
    } catch {
      setErro('Erro ao guardar transportadora')
    } finally {
      setSubmetendoT(false)
    }
  }

  function abrirFormZona(transportadoraId: string, zona?: Zona) {
    setAdicionandoZonaA(transportadoraId)
    if (zona) {
      setEditandoZona(zona)
      setFormZ({
        provincia_origem: zona.provincia_origem, provincia_destino: zona.provincia_destino,
        preco_base: zona.preco_base, preco_por_kg: zona.preco_por_kg,
        preco_por_km: zona.preco_por_km, distancia_km: zona.distancia_km, ativa: zona.ativa,
      })
    } else {
      setEditandoZona(null)
      setFormZ(FORM_VAZIO_ZONA)
    }
  }

  function fecharFormZona() {
    setAdicionandoZonaA(null)
    setEditandoZona(null)
    setFormZ(FORM_VAZIO_ZONA)
  }

  async function submeterZona(e: React.FormEvent) {
    e.preventDefault()
    if (!adicionandoZonaA) return
    setSubmetendoZ(true)
    try {
      if (editandoZona) {
        await api.transportadoras.admin.editarZona(editandoZona.id, formZ)
      } else {
        await api.transportadoras.admin.adicionarZona(adicionandoZonaA, formZ)
      }
      fecharFormZona()
      await carregar()
    } catch {
      setErro('Erro ao guardar zona')
    } finally {
      setSubmetendoZ(false)
    }
  }

  async function removerZona(zonaId: string) {
    if (!confirm('Confirma a remoção desta zona?')) return
    try {
      await api.transportadoras.admin.removerZona(zonaId)
      await carregar()
    } catch {
      setErro('Erro ao remover zona')
    }
  }

  const formatarPreco = (v: number) => `${Number(v).toLocaleString('pt-AO')} Kz`

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Transportadoras e Entregas</h1>
          <p className="text-sm text-gray-500 mt-1">Gerir transportadoras e zonas de entrega</p>
        </div>
        <button
          onClick={() => { setMostrarFormT(true); setEditandoT(null); setFormT(FORM_VAZIO_TRANSPORTADORA) }}
          className="bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Nova Transportadora
        </button>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{erro}</div>
      )}

      {/* Formulário transportadora */}
      {mostrarFormT && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-[#111111] mb-4">{editandoT ? 'Editar Transportadora' : 'Nova Transportadora'}</h2>
          <form onSubmit={submeterTransportadora} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input required value={formT.nome} onChange={e => setFormT(f => ({ ...f, nome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contacto</label>
              <input value={formT.contato} onChange={e => setFormT(f => ({ ...f, contato: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input value={formT.telefone} onChange={e => setFormT(f => ({ ...f, telefone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
              <input value={formT.whatsapp} onChange={e => setFormT(f => ({ ...f, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" id="ativaT" checked={formT.ativa} onChange={e => setFormT(f => ({ ...f, ativa: e.target.checked }))} />
              <label htmlFor="ativaT" className="text-sm text-gray-700">Transportadora activa</label>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" disabled={submetendoT}
                className="bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {submetendoT ? 'A guardar…' : 'Guardar'}
              </button>
              <button type="button" onClick={fecharFormT} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" /></div>
      ) : transportadoras.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhuma transportadora registada</div>
      ) : (
        <div className="space-y-4">
          {transportadoras.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl">🚚</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#111111]">{t.nome}</h3>
                      {!t.ativa && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactiva</span>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {[t.telefone, t.whatsapp && `WhatsApp: ${t.whatsapp}`].filter(Boolean).join(' · ') || 'Sem contacto'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{t.zonas?.length ?? 0} zonas</span>
                  <button onClick={() => abrirFormZona(t.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                    + Zona
                  </button>
                  <button onClick={() => abrirEditarT(t)}
                    className="text-xs border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                    Editar
                  </button>
                  <button onClick={() => setExpandido(expandido === t.id ? null : t.id)}
                    className="text-xs text-[#dc2626] px-2 py-1.5">
                    {expandido === t.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Formulário adicionar zona (inline) */}
              {adicionandoZonaA === t.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold text-[#111111] mb-3">{editandoZona ? 'Editar Zona' : 'Nova Zona de Entrega'}</h4>
                  <form onSubmit={submeterZona} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
                      <select value={formZ.provincia_origem} onChange={e => setFormZ(f => ({ ...f, provincia_origem: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
                        {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Destino</label>
                      <select value={formZ.provincia_destino} onChange={e => setFormZ(f => ({ ...f, provincia_destino: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
                        {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Distância (km)</label>
                      <input type="number" min={0} value={formZ.distancia_km} onChange={e => setFormZ(f => ({ ...f, distancia_km: Number(e.target.value) }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preço base (Kz)</label>
                      <input type="number" min={0} step="0.01" value={formZ.preco_base} onChange={e => setFormZ(f => ({ ...f, preco_base: Number(e.target.value) }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preço/kg (Kz)</label>
                      <input type="number" min={0} step="0.01" value={formZ.preco_por_kg} onChange={e => setFormZ(f => ({ ...f, preco_por_kg: Number(e.target.value) }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Preço/km (Kz)</label>
                      <input type="number" min={0} step="0.01" value={formZ.preco_por_km} onChange={e => setFormZ(f => ({ ...f, preco_por_km: Number(e.target.value) }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]" />
                    </div>
                    <div className="flex items-center gap-2 col-span-2 sm:col-span-3">
                      <input type="checkbox" id={`ativaZ-${t.id}`} checked={formZ.ativa} onChange={e => setFormZ(f => ({ ...f, ativa: e.target.checked }))} />
                      <label htmlFor={`ativaZ-${t.id}`} className="text-xs text-gray-700">Zona activa</label>
                    </div>
                    <div className="flex gap-2 col-span-2 sm:col-span-3">
                      <button type="submit" disabled={submetendoZ}
                        className="bg-[#dc2626] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                        {submetendoZ ? 'A guardar…' : 'Guardar Zona'}
                      </button>
                      <button type="button" onClick={fecharFormZona} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabela de zonas */}
              {expandido === t.id && (
                <div className="border-t border-gray-100">
                  {!t.zonas || t.zonas.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">Nenhuma zona configurada</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-2 text-left">Origem → Destino</th>
                            <th className="px-4 py-2 text-right">Dist.</th>
                            <th className="px-4 py-2 text-right">Preço base</th>
                            <th className="px-4 py-2 text-right">/kg</th>
                            <th className="px-4 py-2 text-right">/km</th>
                            <th className="px-4 py-2 text-center">Activa</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {t.zonas.map(z => (
                            <tr key={z.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium">{z.provincia_origem} → {z.provincia_destino}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{z.distancia_km} km</td>
                              <td className="px-4 py-2.5 text-right">{formatarPreco(z.preco_base)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{formatarPreco(z.preco_por_kg)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{formatarPreco(z.preco_por_km)}</td>
                              <td className="px-4 py-2.5 text-center">
                                {z.ativa ? <span className="text-green-600">✓</span> : <span className="text-gray-300">✗</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => abrirFormZona(t.id, z)}
                                    className="text-xs text-blue-600 hover:underline">Editar</button>
                                  <button onClick={() => removerZona(z.id)}
                                    className="text-xs text-red-600 hover:underline">Remover</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
