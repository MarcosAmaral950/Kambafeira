import { FastifyInstance } from 'fastify'
import { v2 as cloudinary } from 'cloudinary'
import { pipeline } from 'stream/promises'

// Configurar Cloudinary a partir das variáveis de ambiente
function configurarCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key:    CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  })
  return true
}

export async function rotasUpload(servidor: FastifyInstance) {

  // POST /upload/imagem — recebe multipart/form-data, faz upload para Cloudinary
  servidor.post(
    '/upload/imagem',
    { preHandler: [servidor.verificarToken] },
    async (req, reply) => {
      // Verificar que o Cloudinary está configurado
      if (!configurarCloudinary()) {
        reply.status(503)
        return { erro: 'Serviço de upload não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.' }
      }

      // Obter o ficheiro do multipart
      const dados = await req.file()
      if (!dados) {
        reply.status(400)
        return { erro: 'Nenhum ficheiro enviado. Use o campo "imagem".' }
      }

      if (dados.fieldname !== 'imagem') {
        reply.status(400)
        return { erro: 'O campo deve chamar-se "imagem".' }
      }

      // Verificar tipo de ficheiro
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!tiposPermitidos.includes(dados.mimetype)) {
        reply.status(400)
        return { erro: 'Tipo de ficheiro não suportado. Use JPEG, PNG, WebP ou GIF.' }
      }

      // Fazer upload via stream para o Cloudinary
      const resultado = await new Promise<{ secure_url: string; public_id: string }>((resolver, rejeitar) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder:           'kambafeira/pecas',
            resource_type:    'image',
            transformation:   [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          },
          (erro: unknown, resultado: { secure_url: string; public_id: string } | undefined) => {
            if (erro || !resultado) {
              rejeitar(erro instanceof Error ? erro : new Error('Resposta inválida do Cloudinary'))
            } else {
              resolver({ secure_url: resultado.secure_url, public_id: resultado.public_id })
            }
          }
        )

        // Conectar o stream do ficheiro ao stream de upload
        pipeline(dados.file, uploadStream).catch(rejeitar)
      })

      reply.status(201)
      return { url: resultado.secure_url, public_id: resultado.public_id }
    }
  )

  // DELETE /upload/imagem/:public_id — remover imagem do Cloudinary (opcional, para limpeza)
  servidor.delete<{ Params: { public_id: string } }>(
    '/upload/imagem/:public_id',
    { preHandler: [servidor.apenasFornecedor] },
    async (req, reply) => {
      if (!configurarCloudinary()) {
        reply.status(503)
        return { erro: 'Serviço de upload não configurado.' }
      }

      // O public_id pode conter "/" — o cliente deve codificar com encodeURIComponent
      const publicId = decodeURIComponent(req.params.public_id)

      try {
        await cloudinary.uploader.destroy(publicId)
        return { mensagem: 'Imagem removida com sucesso' }
      } catch (erro) {
        reply.status(500)
        return { erro: 'Erro ao remover imagem' }
      }
    }
  )
}
