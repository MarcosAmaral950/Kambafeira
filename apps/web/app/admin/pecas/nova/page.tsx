'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Campo } from '@/components/ui/Campo'
import { Botao } from '@/components/ui/Botao'
import { UploadFotos } from '@/components/ui/UploadFotos'
import { api, ErroAPI } from '@/lib/api'

type Categoria = { id: string; nome: string }
type FornecedorOpcao = { id: string; nome: string }

export default function PaginaNovaPecaAdmin() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorOpcao[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const [form, setForm] = useState({
    fornecedor_id: '',
    categoria_id: '',
    titulo: '',
    descricao: '',
    preco: '',
    condicao: 'bom',
    marca_veiculo: '',
    modelo_veiculo: '',
    ano_veiculo_de: '',
    ano_veiculo_ate: '',
    numero_parte: '',
    estoque: '1',
    fotos: [] as string[],
    status: 'activo',
  })

  useEffect(() => {
    Promise.all([
      api.categorias.listar(),
      api.admin.fornecedoresLista(),
    ]).then(([cats, forns]) => {
      setCategorias(cats as Categoria[])
      setFornecedores(forns as FornecedorOpcao[])
    }).catch(() => {})
  }, [])

  function atualizar(campo: string, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  function atualizarFotos(novasfotos: string[]) {
    setForm(prev => ({ ...prev, fotos: novasfotos }))
  }

  async function submeter(e: FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.fornecedor_id) {
      setErro('Seleccione um fornecedor')
      return
    }

    setCarregando(true)
    try {
      const foto_principal = form.fotos[0] ?? undefined

      const dados = {
        fornecedor_id:  form.fornecedor_id,
        categoria_id:   form.categoria_id,
        titulo:         form.titulo,
        descricao:      form.descricao,
        preco:          parseFloat(form.preco),
        condicao:       form.condicao,
        marca_veiculo:  form.marca_veiculo || undefined,
        modelo_veiculo: form.modelo_veiculo || undefined,
        ano_veiculo_de: form.ano_veiculo_de ? parseInt(form.ano_veiculo_de) : undefined,
        ano_veiculo_ate: form.ano_veiculo_ate ? parseInt(form.ano_veiculo_ate) : undefined,
        numero_parte:   form.numero_parte || undefined,
        estoque:        parseInt(form.estoque),
        fotos:          form.fotos,
        foto_principal,
        status:         form.status,
      }

      await api.admin.criarPecaAdmin(dados)
      router.push('/admin/pecas')
    } catch (err) {
      setErro(err instanceof ErroAPI ? err.message : 'Erro ao criar peça')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-xl font-bold text-[#111111]">Cadastrar Peça (Admin)</h1>
      </div>

      <form onSubmit={submeter} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">

        {/* Fornecedor — campo obrigatório para admin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor *</label>
          <select
            value={form.fornecedor_id}
            onChange={e => atualizar('fornecedor_id', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
          >
            <option value="">Seleccionar fornecedor…</option>
            {fornecedores.map(f => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
          <select
            value={form.categoria_id}
            onChange={e => atualizar('categoria_id', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
          >
            <option value="">Seleccionar categoria…</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <Campo label="Título *" value={form.titulo}
          onChange={e => atualizar('titulo', e.target.value)}
          placeholder="Ex: Correia de Distribuição Hyundai Tucson"
          required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
          <textarea
            value={form.descricao}
            onChange={e => atualizar('descricao', e.target.value)}
            required minLength={10} rows={4}
            placeholder="Descreve a peça, estado, compatibilidade…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Preço (Kz) *" type="number" value={form.preco}
            onChange={e => atualizar('preco', e.target.value)}
            placeholder="5000" required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condição *</label>
            <select
              value={form.condicao}
              onChange={e => atualizar('condicao', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
            >
              <option value="novo">Novo</option>
              <option value="bom">Bom estado</option>
              <option value="regular">Estado regular</option>
              <option value="para_pecas">Para peças</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Marca do veículo" value={form.marca_veiculo}
            onChange={e => atualizar('marca_veiculo', e.target.value)}
            placeholder="Hyundai" />
          <Campo label="Modelo" value={form.modelo_veiculo}
            onChange={e => atualizar('modelo_veiculo', e.target.value)}
            placeholder="Tucson" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Ano do veículo" type="number" value={form.ano_veiculo_de}
            onChange={e => atualizar('ano_veiculo_de', e.target.value)}
            placeholder="2018" />
          <Campo label="Ano até" type="number" value={form.ano_veiculo_ate}
            onChange={e => atualizar('ano_veiculo_ate', e.target.value)}
            placeholder="2023" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo label="Número de parte / OEM" value={form.numero_parte}
            onChange={e => atualizar('numero_parte', e.target.value)}
            placeholder="Ex: 06A-103-601" />
          <Campo label="Estoque" type="number" value={form.estoque}
            onChange={e => atualizar('estoque', e.target.value)}
            placeholder="1" required />
        </div>

        {/* Upload de fotos via Cloudinary */}
        <UploadFotos fotos={form.fotos} onChange={atualizarFotos} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado de publicação</label>
          <select
            value={form.status}
            onChange={e => atualizar('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
          >
            <option value="activo">Publicar agora</option>
            <option value="rascunho">Guardar como rascunho</option>
          </select>
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{erro}</div>
        )}

        <Botao type="submit" carregando={carregando}>
          Cadastrar Peça
        </Botao>
      </form>
    </div>
  )
}
