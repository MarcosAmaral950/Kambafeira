'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Campo } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { api, ErroAPI } from '@/lib/api'

type Categoria = { id: string; nome: string }
type Peca = {
  id: string; titulo: string; descricao: string; preco: string; condicao: string
  categoria_id: string; marca_veiculo?: string; modelo_veiculo?: string
  ano_veiculo_de?: number; estoque: number; foto_principal?: string; status: string
}

export default function PaginaEditarPeca() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [carregando, setCarregando] = useState(false)
  const [a_carregar, setACarregar] = useState(true)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    categoria_id: '', titulo: '', descricao: '', preco: '', condicao: 'bom',
    marca_veiculo: '', modelo_veiculo: '', ano_veiculo_de: '',
    estoque: '1', foto_principal: '', status: 'activo',
  })

  useEffect(() => {
    Promise.all([
      api.categorias.listar(),
      api.pecas.obter(id),
    ]).then(([cats, peca]) => {
      setCategorias(cats as Categoria[])
      const p = peca as Peca
      setForm({
        categoria_id:   p.categoria_id ?? '',
        titulo:         p.titulo,
        descricao:      p.descricao,
        preco:          p.preco,
        condicao:       p.condicao,
        marca_veiculo:  p.marca_veiculo ?? '',
        modelo_veiculo: p.modelo_veiculo ?? '',
        ano_veiculo_de: p.ano_veiculo_de?.toString() ?? '',
        estoque:        p.estoque.toString(),
        foto_principal: p.foto_principal ?? '',
        status:         p.status,
      })
    }).finally(() => setACarregar(false))
  }, [id])

  function atualizar(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  async function submeter(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await api.pecas.editar(id, {
        ...form,
        preco: parseFloat(form.preco),
        estoque: parseInt(form.estoque),
        ano_veiculo_de: form.ano_veiculo_de ? parseInt(form.ano_veiculo_de) : undefined,
        foto_principal: form.foto_principal || undefined,
      })
      router.push('/dashboard/pecas')
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao guardar')
    } finally {
      setCarregando(false)
    }
  }

  if (a_carregar) {
    return <div className="p-6"><div className="h-96 bg-gray-100 animate-pulse rounded-xl" /></div>
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-xl font-bold text-[#111111]">Editar Peça</h1>
      </div>

      <form onSubmit={submeter} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
          <select
            value={form.categoria_id}
            onChange={e => atualizar('categoria_id', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
          >
            <option value="">Seleccionar categoria…</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        <Campo label="Título *" value={form.titulo} onChange={e => atualizar('titulo', e.target.value)} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea value={form.descricao} onChange={e => atualizar('descricao', e.target.value)}
            required minLength={10} rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Preço (Kz) *" type="number" value={form.preco}
            onChange={e => atualizar('preco', e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condição *</label>
            <select value={form.condicao} onChange={e => atualizar('condicao', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
              <option value="novo">Novo</option>
              <option value="bom">Bom estado</option>
              <option value="regular">Estado regular</option>
              <option value="para_pecas">Para peças</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Marca" value={form.marca_veiculo} onChange={e => atualizar('marca_veiculo', e.target.value)} />
          <Campo label="Modelo" value={form.modelo_veiculo} onChange={e => atualizar('modelo_veiculo', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Ano" type="number" value={form.ano_veiculo_de}
            onChange={e => atualizar('ano_veiculo_de', e.target.value)} />
          <Campo label="Estoque" type="number" value={form.estoque}
            onChange={e => atualizar('estoque', e.target.value)} required />
        </div>

        <Campo label="URL da foto principal" value={form.foto_principal}
          onChange={e => atualizar('foto_principal', e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select value={form.status} onChange={e => atualizar('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]">
            <option value="activo">Activo</option>
            <option value="rascunho">Rascunho</option>
            <option value="suspenso">Suspenso</option>
          </select>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{erro}</div>
        )}

        <Botao type="submit" carregando={carregando}>Guardar Alterações</Botao>
      </form>
    </div>
  )
}
