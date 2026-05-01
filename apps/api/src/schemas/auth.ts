import { z } from 'zod'

export const schemaLogin = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password deve ter pelo menos 6 caracteres'),
})

export const schemaRegistoComprador = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  telefone: z.string().max(30).optional(),
})

export const schemaRegistoFornecedor = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  nome: z.string().min(2).max(255),
  telefone: z.string().max(30).optional(),
  chave_convite: z.string().min(10, 'Chave de convite inválida'),
  // Perfil do fornecedor
  nome_empresa: z.string().max(255).optional(),
  tipo: z.enum(['independente', 'desmanche', 'stand', 'empresa']).default('independente'),
  provincia: z.string().max(100).default('Luanda'),
  municipio: z.string().max(100).optional(),
  bairro: z.string().max(150).optional(),
  whatsapp: z.string().max(30).optional(),
})

export type LoginInput = z.infer<typeof schemaLogin>
export type RegistoCompradorInput = z.infer<typeof schemaRegistoComprador>
export type RegistoFornecedorInput = z.infer<typeof schemaRegistoFornecedor>
