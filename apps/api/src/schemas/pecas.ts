import { z } from 'zod'

export const schemaCriarPeca = z.object({
  categoria_id: z.string().uuid('ID de categoria inválido'),
  titulo: z.string().min(3).max(255),
  descricao: z.string().min(10),
  preco: z.number().positive('Preço deve ser positivo'),
  condicao: z.enum(['novo', 'bom', 'regular', 'para_pecas']),
  marca_veiculo: z.string().max(100).optional(),
  modelo_veiculo: z.string().max(100).optional(),
  ano_veiculo_de: z.number().int().min(1900).max(2100).optional(),
  ano_veiculo_ate: z.number().int().min(1900).max(2100).optional(),
  numero_parte: z.string().max(100).optional(),
  fotos: z.array(z.string().url()).default([]),
  foto_principal: z.string().url().optional(),
  estoque: z.number().int().min(0).default(1),
})

export const schemaEditarPeca = schemaCriarPeca.partial().extend({
  status: z.enum(['rascunho', 'activo', 'suspenso']).optional(),
})

export const schemaAtualizarEstoque = z.object({
  estoque: z.number().int().min(0).optional(),
  preco:   z.number().positive('Preço deve ser positivo').optional(),
  status:  z.enum(['rascunho', 'activo', 'suspenso']).optional(),
}).refine(d => d.estoque !== undefined || d.preco !== undefined || d.status !== undefined, {
  message: 'Pelo menos um campo (estoque, preco ou status) deve ser fornecido',
})

export const schemaFiltrosPecas = z.object({
  categoria: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  condicao: z.enum(['novo', 'bom', 'regular', 'para_pecas']).optional(),
  preco_min: z.coerce.number().optional(),
  preco_max: z.coerce.number().optional(),
  q: z.string().optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
})

export const schemaAjusteEstoque = z.object({
  estoque: z.number().int().min(0, 'Estoque não pode ser negativo'),
  tipo: z.enum(['venda_externa', 'stock_recebido', 'correcao', 'dano_perda']),
  observacao: z.string().max(500).optional(),
})

export type CriarPecaInput = z.infer<typeof schemaCriarPeca>
export type EditarPecaInput = z.infer<typeof schemaEditarPeca>
export type FiltrosPecasInput = z.infer<typeof schemaFiltrosPecas>
export type AtualizarEstoqueInput = z.infer<typeof schemaAtualizarEstoque>
export type AjusteEstoqueInput = z.infer<typeof schemaAjusteEstoque>
