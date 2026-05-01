/**
 * Serviço de notificações WhatsApp via Meta Business API
 * Se WHATSAPP_TOKEN não estiver configurado, regista aviso e não envia.
 */

const WHATSAPP_TOKEN    = process.env.WHATSAPP_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
const API_URL           = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`

async function enviarMensagem(telefone: string, mensagem: string): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn('[WhatsApp] WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados — notificação ignorada')
    return
  }

  // Normalizar número: remover espaços/hífens, garantir prefixo 244
  const numero = telefone.replace(/\D/g, '').replace(/^0/, '244')

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: numero,
        type: 'text',
        text: { body: mensagem },
      }),
    })

    if (!res.ok) {
      const erro = await res.json()
      console.error('[WhatsApp] Erro ao enviar mensagem:', erro)
    }
  } catch (err) {
    console.error('[WhatsApp] Falha na ligação à API:', err)
  }
}

// ── Notificações por evento ────────────────────────────────────

export async function notificarNovoPedido(params: {
  telefone: string
  nomeFornecedor: string
  pecaTitulo: string
  compradorNome: string
  precoTotal: string
  pedidoId: string
}) {
  const msg =
    `🔔 *Novo Pedido - KambaFeira*\n\n` +
    `Olá ${params.nomeFornecedor}! Recebeste um novo pedido.\n\n` +
    `📦 Peça: ${params.pecaTitulo}\n` +
    `👤 Comprador: ${params.compradorNome}\n` +
    `💰 Valor: ${Number(params.precoTotal).toLocaleString('pt-AO')} Kz\n\n` +
    `Acede ao teu painel para confirmar:\n` +
    `https://kambafeiraweb-production.up.railway.app/dashboard/pedidos`

  await enviarMensagem(params.telefone, msg)
}

export async function notificarStatusPedido(params: {
  telefone: string
  nomeUtilizador: string
  pecaTitulo: string
  novoStatus: string
  pedidoId: string
}) {
  const labelStatus: Record<string, string> = {
    confirmado:    '✅ Confirmado pelo fornecedor',
    em_preparacao: '📦 Em preparação',
    enviado:       '🚚 A caminho',
    entregue:      '🎉 Entregue com sucesso',
    cancelado:     '❌ Cancelado',
  }

  const label = labelStatus[params.novoStatus] ?? params.novoStatus

  const msg =
    `📬 *Actualização de Pedido - KambaFeira*\n\n` +
    `Olá ${params.nomeUtilizador}!\n\n` +
    `Peça: ${params.pecaTitulo}\n` +
    `Estado: ${label}\n\n` +
    `Ver detalhes:\n` +
    `https://kambafeiraweb-production.up.railway.app/pedidos`

  await enviarMensagem(params.telefone, msg)
}
