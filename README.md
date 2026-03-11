# PIGBIT API

Plataforma SaaS de Pagamentos em Criptomoedas. Gateway: NOWPayments.

## Requisitos

- Node 20+
- Yarn
- Docker (PostgreSQL, Redis)

## Setup

```bash
yarn install
cp .env.example .env
docker-compose up -d postgres redis
yarn start:dev
```

## Docker (full stack)

```bash
docker-compose up -d
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| DATABASE_URL | PostgreSQL connection string |
| REDIS_URL | Redis connection string |
| JWT_SECRET | Segredo para tokens JWT |
| NOWPAYMENTS_API_URL | URL base da API NOWPayments |
| NOWPAYMENTS_USE_SANDBOX | `true` para sandbox, `false` para produção |
| NOWPAYMENTS_API_KEY | Chave API NOWPayments |
| NOWPAYMENTS_IPN_SECRET | Segredo para validação HMAC do webhook |
| SMTP_HOST | Host SMTP para envio de emails |
| SMTP_PORT | Porta SMTP (587) |
| SMTP_USER | Usuário SMTP |
| SMTP_PASS | Senha SMTP |
| EMAIL_FROM | Email remetente |
| APP_URL | URL base da aplicação |

## Swagger

http://localhost:3000/api/docs (ajuste a porta conforme `PORT` no `.env`)

## WebSocket — tempo real (checkout e monitoramento)

- **Namespace:** `/realtime` (Socket.IO, path `/socket.io`)
- **Checkout:** após conectar, emitir `subscribeCheckout` com o `paymentId` (string). Eventos: `invoiceStatus` quando o webhook alterar o status do pedido (carrinho = fatura).
- **Monitoramento:** emitir `subscribeHealth` para receber `serviceEvent` a cada atualização de status de fatura (feedback em tempo real).
- **Doc:** `docs/CARRINHO_PEDIDO_E_TEMPO_REAL.md`
- **CORS:** habilitado em `main.ts` para origem do frontend.

Frontend: definir `NEXT_PUBLIC_API_URL` com a URL direta da API (rewrites do Next não fazem upgrade WebSocket).

## Endpoints

- `POST /auth/register` - Registro de lojista
- `POST /auth/login` - Login (retorna `requires2fa` se 2FA ativo)
- `POST /auth/login/2fa` - Login com código 2FA
- `POST /auth/password-reset/request` - Solicitar reset de senha
- `POST /auth/password-reset/confirm` - Confirmar nova senha
- `POST /auth/email-verify/send` - Enviar código verificação email
- `POST /auth/email-verify/validate` - Validar código email
- `POST /auth/2fa/enable` - Ativar 2FA (QR Code)
- `POST /auth/2fa/verify-enable` - Confirmar 2FA
- `POST /auth/2fa/disable` - Desativar 2FA
- `GET /users/me` - Perfil (JWT)
- `PATCH /users/me` - Atualizar perfil (telefone, nome fantasia)
- `POST /users/me/sensitive-change/request` - Solicitar código para alterar email/CNPJ
- `PATCH /users/me/email` - Alterar email (código + 2FA se ativo)
- `PATCH /users/me/cnpj` - Alterar CNPJ (código + 2FA se ativo)
- `POST /products` - Cadastrar produto (JWT)
- `GET /products` - Listar produtos (JWT)
- `POST /invoices` - Criar invoice/cobrança (JWT)
- `GET /invoices/checkout/:paymentId` - Dados para checkout (público)
- `POST /webhooks/nowpayments` - Webhook NOWPayments
- `GET /companies/cnpj/:cnpj` - Consulta CNPJ (BrasilAPI) - público
- `GET /companies/me` - Empresa do lojista
- `POST /companies` - Cadastrar/atualizar empresa
- `GET /audit-logs` - Histórico de auditoria (RF-028)
