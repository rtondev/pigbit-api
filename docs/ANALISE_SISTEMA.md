# Analise do Sistema Pigbit

## Visao geral
Backend Java 21 + Spring Boot 4.x com camadas bem separadas (application/controllers, core/services, core/models e infrastructure). O sistema expõe API REST para cadastro de lojistas, emissao de invoices cripto (NOWPayments), carteira de saque, withdrawals, auditoria, termos, api-keys e dashboard. Usa PostgreSQL com Flyway e Redis opcional para fluxos temporarios e rate limit.

## Componentes principais

### Aplicacao (API REST)
Controladores em `src/main/java/com/pigbit/application/controller`:
- AuthController: registro, confirmacao, login, 2FA, reset de senha, verificacao de email.
- UserController: perfil do usuario autenticado.
- CompanyController: dados juridicos e consulta CNPJ.
- ProductController: CRUD de produtos.
- InvoiceController: CRUD de invoices e checkout publico.
- WalletController: CRUD de carteiras.
- WithdrawalController: solicitacao e consulta de saques.
- DashboardController: metricas e transacoes.
- TermsController: aceite de termos e historico.
- ApiKeyController: criacao e revogacao de API keys.
- AuditLogController: listagem de auditoria.
- WebhookEventController: listagem de webhooks recebidos.
- NowPaymentsWebhookController: webhook publico de pagamento.

DTOs em `src/main/java/com/pigbit/application/dto` para requests e responses.

Tratamento de erros em `GlobalExceptionHandler` com `ErrorResponse`.

### Dominio (Core)
Entidades JPA em `src/main/java/com/pigbit/core/model`:
- User, Company, Product, Invoice, Transaction, Wallet, Withdrawal.
- AuditLog, WebhookEvent, TermsAcceptance, ApiKey.
- AuditableEntity com soft-delete (`deleted_at`) e timestamps `created_at`/`updated_at`.

Servicos em `src/main/java/com/pigbit/core/service`:
- AuthService: registro, login, 2FA, reset de senha e lockout.
- VerificationService: codigo de email e reset de senha (Redis).
- JwtService: emissao e validacao de JWT.
- TwoFactorAuthService: TOTP com Google Authenticator.
- UserService, CompanyService, ProductService, WalletService.
- InvoiceService: criacao, listagem, cancelamento, checkout.
- NowPaymentsWebhookService: validacao HMAC e atualizacao de invoice/transaction.
- WithdrawalService: regras de saque e alerta de seguranca.
- DashboardService: metricas e historico transacional.
- TermsService: aceite de termos e historico.
- ApiKeyService: criacao, hash e revogacao de chaves.
- AuditLogService e WebhookEventService: consulta de logs.

### Infraestrutura
- Persistence (Spring Data JPA) em `src/main/java/com/pigbit/infrastructure/persistence`.
- Security em `src/main/java/com/pigbit/infrastructure/security`.
  - JwtAuthenticationFilter
  - RateLimitFilter (Redis + fallback local)
- Integracoes externas:
  - NowPaymentsClient (REST)
  - HttpCnpjLookupService (REST + cache Redis)
- Email:
  - SmtpEmailService (JavaMailSender)
- Redis:
  - RedisService (StringRedisTemplate, JSON via Jackson)
- Configuracoes:
  - SecurityConfig, JacksonConfig, OpenApiConfig

## Classes e metodos principais

### AuthService
- register(UserRegistrationRequest, ip, userAgent): cria registro pendente no Redis e envia email.
- confirmRegistration(RegisterConfirmRequest, ip, userAgent): valida codigo, cria User/Company/TermsAcceptance.
- login(LoginRequest, ip, userAgent): valida senha, gera codigo por email (Redis).
- loginWith2fa(LoginTwoFactorRequest, ip, userAgent): valida codigo email + 2FA opcional e emite JWT.
- confirmPasswordReset(PasswordResetConfirmRequest): valida token e atualiza senha.

### InvoiceService
- createInvoice(InvoiceRequest, userEmail): valida valor, chama NOWPayments, grava invoice.
- listByUser(userEmail, pageable) e getById.
- cancel(userEmail, id): cancela no gateway e expira invoice.
- getCheckout(paymentId): dados para checkout publico, incluindo qrData.

### NowPaymentsWebhookService
- handleWebhook(payload, signature): valida HMAC, grava WebhookEvent, atualiza Invoice e Transaction.

### WithdrawalService
- requestWithdrawal(WithdrawalRequest, userEmail, ip, userAgent): valida senha e 2FA, calcula saldo, cria saque.
- list e getById.

### DashboardService
- getMetrics(userEmail): total processado, invoices ativas, saldo e serie 7 dias.
- listTransactions e getTransaction.

### ApiKeyService
- create(userEmail, request): gera chave bruta, salva hash, retorna chave apenas uma vez.
- list e revoke.

### VerificationService
- createPasswordResetCode(taxId): gera token e envia email.
- sendEmailVerification(): gera codigo email e envia.
- validateEmailCode(code): valida e marca verificado.

### TwoFactorAuthService
- generateQrCode(email): gera secret e URL otpauth.
- enable2fa(email, code) / disable2fa(email).

### RateLimitFilter
- Aplica limites por IP e rota em endpoints de auth (Redis se disponivel).

## Fluxos de dados

### 1. Registro
1. POST /api/v1/auth/register
2. AuthService gera codigo, guarda em Redis `register:pending:{email}`.
3. Email enviado com codigo.
4. POST /api/v1/auth/register/confirm
5. Valida codigo, consulta CNPJ, cria User + Company + TermsAcceptance.
6. Audit log: REGISTER_REQUEST e REGISTER_CONFIRM.

### 2. Login com 2 etapas (email + 2FA opcional)
1. POST /api/v1/auth/login
2. Valida senha, cria codigo em Redis `login:code:{email}`.
3. POST /api/v1/auth/login/2fa
4. Valida codigo email e, se habilitado, 2FA TOTP.
5. Emite JWT.

Lockout: tentativas falhas criam `login:fail:{email}` e `login:lock:{email}` (15 min).

### 3. Verificacao de email
1. POST /api/v1/auth/email-verify/send
2. Redis `email:verify:{userId}` com codigo.
3. POST /api/v1/auth/email-verify/validate
4. Marca email verificado.

### 4. Reset de senha
1. POST /api/v1/auth/password-reset/request (por taxId)
2. Redis `reset:token:{token}` -> email
3. POST /api/v1/auth/password-reset/confirm
4. Atualiza senha e remove token.

### 5. Emissao de invoice
1. POST /api/v1/invoices
2. Valida valor (produto ou manual), chama NowPayments.
3. Salva invoice com `paymentId`.
4. Checkout publico: GET /api/v1/invoices/checkout/{paymentId}

### 6. Webhook NOWPayments
1. POST /api/v1/webhooks/nowpayments
2. Valida HMAC (x-nowpayments-sig).
3. Atualiza invoice e transaction.
4. Salva WebhookEvent.

### 7. Saques
1. POST /api/v1/withdrawals
2. Valida senha/2FA, saldo disponivel e carteira ativa.
3. Verifica alerta de seguranca (threshold vs media).
4. Cria Withdrawal status PENDING.

### 8. Termos
1. POST /api/v1/terms/accept
2. Salva TermsAcceptance.
3. GET /api/v1/terms/history.

### 9. Api Keys
1. POST /api/v1/api-keys
2. Retorna chave apenas na criacao.
3. GET /api/v1/api-keys / DELETE /api/v1/api-keys/{id}

## Banco de dados (PostgreSQL)
Flyway `V1__initial_schema.sql` cria:
- users, companies, products, invoices, transactions, wallets, withdrawals
- audit_logs (metadata JSONB)
- webhook_events
- terms_acceptances
- api_keys

Relacionamentos:
- users 1:N companies, products, invoices, wallets, withdrawals, audit_logs, terms_acceptances, api_keys
- invoices 1:1 transactions
- invoices N:1 products
- webhook_events -> invoices via payment_id

Soft delete:
- `AuditableEntity` usa `deleted_at` e @SQLDelete.

Consultas customizadas:
- `InvoiceRepository`: somatorios, contagens e series temporais.
- `WithdrawalRepository`: soma total e media por usuario.

## Redis
Uso opcional, mas obrigatorio para auth/verification e rate limit.

Chaves:
- `register:pending:{email}` (JSON)
- `login:code:{email}` (JSON)
- `login:fail:{email}` (contador)
- `login:lock:{email}` (flag)
- `reset:token:{token}` (email)
- `email:verify:{userId}` (codigo)
- `cnpj:{taxId}` (cache JSON)
- `rate:{path}:{ip}` (contador)

TTL definidos nos servicos (10-30 min, 12h para CNPJ).

## Seguranca
- JWT Bearer token com `jwt.secret`.
- Rotas publicas: auth/register/login/reset, checkout, webhook, swagger.
- Rate limit por rota e IP.
- 2FA TOTP opcional.

## Utilizacao (alto nivel)
- Configure `.env` ou variaveis: DB, JWT, Redis, Email, NowPayments, CNPJ API.
- Suba com `docker compose` ou `./mvnw spring-boot:run`.
- Swagger em `/swagger`.

## Observacoes de integracao
- NOWPayments: requer `nowpayments.base-url`, `nowpayments.api-key` e `nowpayments.ipn-secret`.
- CNPJ: `cnpj.api.base-url`.
- Email: `spring.mail.*` e `app.mail.from`.
- Redis: `spring.data.redis.*`.
