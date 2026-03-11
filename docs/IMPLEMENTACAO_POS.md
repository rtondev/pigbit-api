# Pigbit — Onde e como foi aplicado (Programação Orientada a Serviços)

Repositórios:

- **Frontend:** [github.com/rtondev/pigbit](https://github.com/rtondev/pigbit)
- **API (NestJS, Postgres, NOWPayments):** [github.com/rtondev/pigbit-api](https://github.com/rtondev/pigbit-api)

Abaixo: resumo por tema, com links diretos para diagramas e código no GitHub (branch `main`).

---

## 1. Máquina de estados — sessão e autenticação

**Aplicação:** Diagrama de estados (Mermaid) para sessão (anônimo → autenticando → autenticado → expirado). Na API, JWT no login; no cliente, token em `localStorage`; guards validam Bearer ou `X-API-KEY` a cada requisição (stateless).

**Referências**

| O quê | Link |
|--------|------|
| Diagrama estados (frontend) | [state_session_checkout_cart.mmd](https://github.com/rtondev/pigbit/blob/main/diagrams/frontend/state_session_checkout_cart.mmd) |
| Fluxo segurança (API) | [security_auth.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/security_auth.mmd) |
| Auth API | [src/modules/auth](https://github.com/rtondev/pigbit-api/tree/main/src/modules/auth) |
| AuthContext (frontend) | [AuthContext.tsx](https://github.com/rtondev/pigbit/blob/main/contexts/AuthContext.tsx) |
| Guard JWT/API Key | [jwt-or-apikey.guard.ts](https://github.com/rtondev/pigbit-api/blob/main/src/common/guards/jwt-or-apikey.guard.ts) |

---

## 2. Transição de estados — carrinho / checkout / pedido

**Aplicação:** O carrinho foi modelado como pedido na entidade **fatura (invoice)**. Ao criar cobrança, gera-se `payment_id`; o status do pedido é o status da fatura, atualizado pelo webhook NOWPayments. Não há tabela carrinho separada.

**Referências**

| O quê | Link |
|--------|------|
| Estados sessão + checkout | [state_session_checkout_cart.mmd](https://github.com/rtondev/pigbit/blob/main/diagrams/frontend/state_session_checkout_cart.mmd) |
| Estados fatura | [state_invoice.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/state_invoice.mmd) |
| Sequência checkout + webhook + WS | [sequence_checkout.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/sequence_checkout.mmd) |
| Lógica de status | [invoices.service.ts](https://github.com/rtondev/pigbit-api/blob/main/src/modules/invoices/invoices.service.ts) |
| Webhook e mapa de status | [webhooks.service.ts](https://github.com/rtondev/pigbit-api/blob/main/src/modules/webhooks/webhooks.service.ts) |
| Página checkout | [page.tsx](https://github.com/rtondev/pigbit/blob/main/app/checkout/%5BpaymentId%5D/page.tsx) |

---

## 3. Comunicação assíncrona (JSON + tempo real)

**Aplicação:** HTTP assíncrono com `fetch`, `application/json` e JWT. Tempo real via Socket.IO (`/realtime`): após o webhook, a API emite `invoiceStatus` na sala `checkout:paymentId`; o checkout inscreve-se e atualiza sem polling.

**Referências**

| O quê | Link |
|--------|------|
| Cliente HTTP | [lib/api.ts](https://github.com/rtondev/pigbit/blob/main/lib/api.ts) |
| Gateway e salas | [src/realtime](https://github.com/rtondev/pigbit-api/tree/main/src/realtime) |
| Evento interno | [realtime.events.ts](https://github.com/rtondev/pigbit-api/blob/main/src/realtime/realtime.events.ts) |
| Cliente Socket.IO | [lib/realtime.ts](https://github.com/rtondev/pigbit/blob/main/lib/realtime.ts) |
| Sequência tempo real | [sequence_realtime_feedback.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/sequence_realtime_feedback.mmd) |
| Texto carrinho + WS | [CARRINHO_PEDIDO_E_TEMPO_REAL.md](./CARRINHO_PEDIDO_E_TEMPO_REAL.md) |

---

## 4. Stateless — tokens

**Aplicação:** Login retorna JWT; sem sessão no servidor; validação por token ou chave API.

**Referências**

| O quê | Link |
|--------|------|
| Emissão JWT | [auth.service.ts](https://github.com/rtondev/pigbit-api/blob/main/src/modules/auth/auth.service.ts) |
| Estratégia JWT | [auth/strategies](https://github.com/rtondev/pigbit-api/tree/main/src/modules/auth/strategies) |

---

## 5. Feedback e monitoramento

**Aplicação:** Health na raiz, stats públicas, auditoria, listagem de eventos de webhook. WebSocket: sala `health` recebe `serviceEvent` quando o status da fatura muda.

**Referências**

| O quê | Link |
|--------|------|
| Health e stats | [app.controller.ts](https://github.com/rtondev/pigbit-api/blob/main/src/app.controller.ts) |
| Auditoria | [audit-logs](https://github.com/rtondev/pigbit-api/tree/main/src/modules/audit-logs) |
| Webhooks | [webhooks](https://github.com/rtondev/pigbit-api/tree/main/src/modules/webhooks) |
| README (WebSocket) | [README.md](https://github.com/rtondev/pigbit-api/blob/main/README.md) |

---

## 6. Catálogo de serviços (endpoints)

**Aplicação:** Swagger/OpenAPI a partir dos controllers; lista no README.

**Referências**

| O quê | Link |
|--------|------|
| Swagger | [main.ts](https://github.com/rtondev/pigbit-api/blob/main/src/main.ts) |
| Lista endpoints | [README.md](https://github.com/rtondev/pigbit-api/blob/main/README.md) |
| Controllers | [src/modules](https://github.com/rtondev/pigbit-api/tree/main/src/modules) |

---

## 7. NOWPayments e webhooks

**Aplicação:** Criação de pagamento na API NOWPayments; IPN com HMAC sha512; persistência do payload; atualização da fatura conforme `payment_status`.

**Referências**

| O quê | Link |
|--------|------|
| Config | [configuration.ts](https://github.com/rtondev/pigbit-api/blob/main/src/config/configuration.ts) |
| Serviço NOWPayments | [nowpayments.service.ts](https://github.com/rtondev/pigbit-api/blob/main/src/integrations/nowpayments/nowpayments.service.ts) |
| Rota webhook | [webhooks.controller.ts](https://github.com/rtondev/pigbit-api/blob/main/src/modules/webhooks/webhooks.controller.ts) |
| Sequência webhook | [sequence_webhook.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/sequence_webhook.mmd) |

---

## 8. DER (persistência)

**Aplicação:** ER conceitual e lógico em Mermaid; entidades TypeORM alinhadas ao modelo.

**Referências**

| O quê | Link |
|--------|------|
| ER conceitual | [er_conceitual.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/er_conceitual.mmd) |
| ER lógico | [er_logico.mmd](https://github.com/rtondev/pigbit-api/blob/main/diagrams/er_logico.mmd) |
| Entidades | [src/entities](https://github.com/rtondev/pigbit-api/tree/main/src/entities) |

---

## 9. Contratos e validação

**Aplicação:** DTOs com class-validator; ApiProperty no Swagger (OpenAPI com esquemas compatíveis com JSON Schema).

**Referências**

| O quê | Link |
|--------|------|
| DTOs auth | [auth/dto](https://github.com/rtondev/pigbit-api/tree/main/src/modules/auth/dto) |
| DTOs invoices | [invoices/dto](https://github.com/rtondev/pigbit-api/tree/main/src/modules/invoices/dto) |

---

## Índice de diagramas

- API: [github.com/rtondev/pigbit-api/tree/main/diagrams](https://github.com/rtondev/pigbit-api/tree/main/diagrams)
- Frontend: [github.com/rtondev/pigbit/tree/main/diagrams/frontend](https://github.com/rtondev/pigbit/tree/main/diagrams/frontend)
