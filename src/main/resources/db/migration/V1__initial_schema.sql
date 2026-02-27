-- ==========================================
-- PIGBIT - DATABASE SCHEMA (POSTGRESQL)
-- Version: 1.0.0
-- ==========================================

-- Habilitar extensão para UUID se necessário no futuro
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (Lojistas)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20) NOT NULL, -- CNPJ
    phone VARCHAR(20),
    trading_name VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret VARCHAR(255),
    email_verified_at TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT FALSE,
    lockout_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 2. Tabela de Empresas (Dados Jurídicos)
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tax_id VARCHAR(20) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    address TEXT,
    business_activity_code VARCHAR(20), -- CNAE
    registration_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 3. Tabela de Produtos
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_brl DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 4. Tabela de Invoices (Faturas)
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT, -- Nullable se for valor manual
    amount_brl DECIMAL(15, 2) NOT NULL,
    amount_crypto DECIMAL(20, 8),
    crypto_currency VARCHAR(10),
    gateway_fee DECIMAL(15, 2),
    platform_fee DECIMAL(15, 2),
    exchange_rate DECIMAL(20, 8),
    payment_id VARCHAR(100) UNIQUE NOT NULL, -- ID Externo NOWPayments
    pay_address VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- waiting, confirming, confirmed, finished, expired
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 5. Tabela de Transações (On-chain)
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL UNIQUE,
    tx_hash VARCHAR(255),
    explorer_link TEXT,
    status VARCHAR(50),
    amount_brl DECIMAL(15, 2),
    amount_crypto DECIMAL(20, 8),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 6. Tabela de Carteiras de Saque
CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    address VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 7. Tabela de Saques (Withdrawals)
CREATE TABLE withdrawals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    wallet_id BIGINT NOT NULL,
    amount_brl DECIMAL(15, 2) NOT NULL,
    fee_applied DECIMAL(15, 2),
    status VARCHAR(50) NOT NULL,
    security_alert BOOLEAN DEFAULT FALSE,
    tx_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 8. Logs de Auditoria (JSONB para flexibilidade)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45), -- Suporta IPv6
    user_agent TEXT,
    metadata JSONB, -- Armazena diffs ou detalhes da ação
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 9. Registro de Webhooks Recebidos
CREATE TABLE webhook_events (
    id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(100) NOT NULL,
    payload_raw TEXT NOT NULL,
    is_valid_signature BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 10. Fluxos temporários (e-mail/2FA/reset) ficam no Redis

-- 13. Aceite de Termos
CREATE TABLE terms_acceptances (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- terms, privacy_policy
    version VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    accepted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 14. Fluxos temporários ficam no Redis

-- 16. API Keys
CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100),
    key_prefix VARCHAR(12) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- ==========================================
-- CONSTRAINTS & FOREIGN KEYS
-- ==========================================

ALTER TABLE companies ADD CONSTRAINT fk_company_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE products ADD CONSTRAINT fk_product_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE invoices ADD CONSTRAINT fk_invoice_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE invoices ADD CONSTRAINT fk_invoice_product FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE transactions ADD CONSTRAINT fk_transaction_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id);
ALTER TABLE wallets ADD CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE withdrawals ADD CONSTRAINT fk_withdrawal_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE withdrawals ADD CONSTRAINT fk_withdrawal_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id);
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE webhook_events ADD CONSTRAINT fk_webhook_invoice FOREIGN KEY (payment_id) REFERENCES invoices(payment_id);
ALTER TABLE terms_acceptances ADD CONSTRAINT fk_terms_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE api_keys ADD CONSTRAINT fk_api_keys_user FOREIGN KEY (user_id) REFERENCES users(id);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- ==========================================
-- UPDATED_AT TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_audit_logs_updated_at BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_webhook_events_updated_at BEFORE UPDATE ON webhook_events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_terms_acceptances_updated_at BEFORE UPDATE ON terms_acceptances FOR EACH ROW EXECUTE FUNCTION set_updated_at();
