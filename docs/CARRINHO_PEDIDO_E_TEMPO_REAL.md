# Carrinho, pedido e tempo real

## Carrinho = pedido (fatura)

Não existe tabela `carrinho` separada. O fluxo de compra é:

1. **Lojista** cria uma **fatura** (`POST /invoices`) — equivale a “fechar o carrinho” com valor/produto.
2. A API gera `payment_id` na NowPayments e persiste **uma linha em `invoices`** com `status` inicial (ex.: `waiting`).
3. O **comprador** paga no endereço exibido no checkout (`/checkout/[paymentId]`).
4. A **NowPayments** chama `POST /webhooks/nowpayments`; a API valida HMAC e chama `InvoicesService.updateStatus`, **alterando o status do pedido** (mesma entidade fatura).

Ou seja: **tecnicamente o “carrinho” é o pedido** cujo ciclo de vida é o **status da fatura** (`waiting` → `confirming` → `finished` / `expired` / `failed`, etc.).

## Comunicação assíncrona

- **HTTP + JSON**: cliente usa `fetch` com `Content-Type: application/json` e JWT (stateless).
- **WebSocket (Socket.IO)**: após o webhook atualizar a fatura, a API emite o evento `invoiceStatus` na sala `checkout:{paymentId}` — o frontend **não precisa fazer polling** para ver o pagamento confirmado.

### Namespace e eventos

| Onde        | Valor                          |
|------------|---------------------------------|
| Namespace  | `/realtime`                     |
| Path       | `/socket.io` (padrão)           |
| Inscrição  | Emit `subscribeCheckout` com `paymentId` (string) |
| Evento     | `invoiceStatus` — `{ paymentId, status, txHash? }` |
| Monitoramento | Emit `subscribeHealth` — recebe `serviceEvent` quando status de fatura muda |

### Variáveis de ambiente (frontend)

O Next faz proxy só de HTTP (`/api` → API). **WebSocket precisa da URL direta da API:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

(alinhar com `API_URL` usado no `next.config`.)

## Onde está no código

- Emissão após atualizar status: `InvoicesService.updateStatus` → `EventEmitter` → `RealtimeGateway` → `invoiceStatus`.
- Gateway: `src/realtime/realtime.gateway.ts`
- Cliente checkout: `pigbit/lib/realtime.ts` + `app/checkout/[paymentId]/page.tsx`
