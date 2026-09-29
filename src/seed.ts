/**
 * Dados de demonstração. Uso: node dist/seed.js (lê DATABASE_URL).
 * Idempotente: se o usuário demo já existir, apaga e recria só os dados dele.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DataSource } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Company } from './entities/company.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { FailedLoginAttempt } from './entities/failed-login-attempt.entity';
import { Invoice } from './entities/invoice.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { PendingRegistration } from './entities/pending-registration.entity';
import { Product } from './entities/product.entity';
import { SensitiveChangeCode } from './entities/sensitive-change-code.entity';
import { Transaction } from './entities/transaction.entity';
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Withdrawal } from './entities/withdrawal.entity';

const DEMO_EMAIL = process.env.SEED_EMAIL || 'demo@pigbit.com';
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Pigbit@2026';

const COINS = [
  { moeda: 'btc', cotacao: 350_000, explorer: 'https://mempool.space/tx/' },
  { moeda: 'eth', cotacao: 13_500, explorer: 'https://etherscan.io/tx/' },
  { moeda: 'usdttrc20', cotacao: 5.4, explorer: 'https://tronscan.org/#/transaction/' },
];

const PRODUCTS = [
  { nome: 'Plano Básico', descricao: 'Assinatura mensal do plano básico.', valor: 49.9 },
  { nome: 'Plano Pro', descricao: 'Assinatura mensal com recursos avançados.', valor: 149.9 },
  { nome: 'Consultoria (1h)', descricao: 'Hora de consultoria técnica.', valor: 300 },
  { nome: 'E-book Cripto para Negócios', descricao: 'Guia digital em PDF.', valor: 29.9 },
  { nome: 'Licença Anual', descricao: 'Licença de uso por 12 meses.', valor: 1290 },
];

const STATUS_POOL = [
  'finished', 'finished', 'finished', 'finished', 'finished', 'finished',
  'confirmed', 'sending', 'waiting', 'confirming', 'expired', 'expired', 'failed',
];

function hex(bytes: number) {
  return randomBytes(bytes).toString('hex');
}

function pick<T>(items: T[], i: number) {
  return items[i % items.length];
}

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://pigbit:pigbit@localhost:5432/pigbit',
    entities: [
      User, Company, Product, Invoice, Transaction, Wallet, Withdrawal, AuditLog,
      WebhookEvent, EmailVerificationCode, PendingRegistration, PasswordResetCode,
      FailedLoginAttempt, SensitiveChangeCode, ApiKey,
    ],
    synchronize: true,
  });
  await dataSource.initialize();

  await dataSource.transaction(async (m) => {
    const existing = await m.findOne(User, { where: { email: DEMO_EMAIL } });
    if (existing) {
      const invoiceIds = (
        await m.find(Invoice, { where: { userId: existing.id }, select: { id: true } })
      ).map((i) => i.id);
      if (invoiceIds.length) {
        await m.createQueryBuilder().delete().from(Transaction)
          .where('invoice_id IN (:...ids)', { ids: invoiceIds }).execute();
      }
      await m.delete(Withdrawal, { userId: existing.id });
      await m.delete(Invoice, { userId: existing.id });
      await m.delete(Product, { userId: existing.id });
      await m.delete(Wallet, { userId: existing.id });
      await m.delete(Company, { userId: existing.id });
      await m.delete(AuditLog, { userId: existing.id });
      await m.delete(User, { id: existing.id });
    }

    const user = await m.save(
      m.create(User, {
        email: DEMO_EMAIL,
        passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
        cnpj: '12345678000195',
        telefone: '84999990000',
        nomeFantasia: 'Loja Demo Pigbit',
        razaoSocial: 'Pigbit Demonstração LTDA',
        endereco: 'Av. Senador Salgado Filho, 1559 - Natal/RN',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        twoFaEnabled: false,
        isLocked: false,
      }),
    );

    await m.save(
      m.create(Company, {
        userId: user.id,
        cnpj: '12345678000195',
        razaoSocial: 'Pigbit Demonstração LTDA',
        nomeFantasia: 'Loja Demo Pigbit',
        endereco: 'Av. Senador Salgado Filho, 1559 - Natal/RN',
        cnae: '6201-5/01 - Desenvolvimento de software sob encomenda',
        situacaoCadastral: 'ATIVA',
      }),
    );

    const wallets = await m.save(
      [
        { moeda: 'btc', endereco: `bc1q${hex(19)}` },
        { moeda: 'eth', endereco: `0x${hex(20)}` },
        { moeda: 'usdttrc20', endereco: `T${hex(16).toUpperCase().slice(0, 33)}` },
      ].map((w) => m.create(Wallet, { ...w, userId: user.id, ativo: true })),
    );

    const products = await m.save(
      PRODUCTS.map((p) =>
        m.create(Product, {
          userId: user.id,
          nome: p.nome,
          descricao: p.descricao,
          valorBrl: p.valor.toFixed(2),
        }),
      ),
    );

    const now = Date.now();
    const day = 86_400_000;
    let paidTotal = 0;
    for (let i = 0; i < 36; i += 1) {
      const product = pick(products, i * 7 + 3);
      const coin = pick(COINS, i * 5 + 1);
      const status = pick(STATUS_POOL, i * 11 + 2);
      const createdAt = new Date(now - Math.floor(((i * 37) % 60) * day + ((i * 13) % 24) * 3_600_000));
      const valorBrl = parseFloat(product.valorBrl);
      const variacao = 1 + (((i * 17) % 7) - 3) / 100;
      const cotacao = coin.cotacao * variacao;
      const valorCripto = valorBrl / cotacao;
      const isRecentOpen = ['waiting', 'confirming'].includes(status);
      const created = isRecentOpen ? new Date(now - ((i % 5) + 1) * 600_000) : createdAt;

      const invoice = await m.save(
        m.create(Invoice, {
          userId: user.id,
          productId: product.id,
          valorBrl: valorBrl.toFixed(2),
          valorCripto: valorCripto.toFixed(8),
          moedaCripto: coin.moeda,
          taxaGateway: (valorBrl * 0.005).toFixed(2),
          taxaPlataforma: (valorBrl * 0.01).toFixed(2),
          cotacaoMomento: cotacao.toFixed(8),
          paymentId: `demo-${Date.now().toString(36)}-${i}-${hex(3)}`,
          payAddress: pick(wallets, i).endereco,
          status,
          expiresAt: new Date(created.getTime() + 20 * 60_000),
          createdAt: created,
        }),
      );

      if (['finished', 'confirmed', 'sending', 'confirming', 'failed'].includes(status)) {
        const hash = coin.moeda === 'eth' ? `0x${hex(32)}` : hex(32);
        const paid = ['finished', 'confirmed', 'sending'].includes(status);
        if (paid) paidTotal += valorBrl - valorBrl * 0.015;
        await m.save(
          m.create(Transaction, {
            invoiceId: invoice.id,
            hashTransacao: hash,
            linkExplorer: `${coin.explorer}${hash}`,
            status,
            valorBrl: valorBrl.toFixed(2),
            valorCripto: valorCripto.toFixed(8),
            confirmedAt: paid ? new Date(created.getTime() + 8 * 60_000) : undefined,
            createdAt: new Date(created.getTime() + 3 * 60_000),
          }),
        );
      }
    }

    const withdrawals = [
      { share: 0.35, status: 'completed', daysAgo: 20 },
      { share: 0.2, status: 'completed', daysAgo: 7 },
      { share: 0.1, status: 'processing', daysAgo: 1 },
      { share: 0.05, status: 'pending', daysAgo: 0 },
    ];
    for (const [i, w] of withdrawals.entries()) {
      const amount = paidTotal * w.share;
      await m.save(
        m.create(Withdrawal, {
          userId: user.id,
          walletId: pick(wallets, i).id,
          amountBrl: amount.toFixed(2),
          feeApplied: (amount * 0.01).toFixed(2),
          status: w.status,
          securityAlert: false,
          txHash: w.status === 'completed' ? hex(32) : undefined,
          createdAt: new Date(now - w.daysAgo * day - 3_600_000),
        }),
      );
    }
  });

  const counts = await Promise.all(
    [User, Product, Wallet, Invoice, Transaction, Withdrawal].map(async (entity) => [
      entity.name,
      await dataSource.getRepository(entity).count(),
    ]),
  );
  console.log(`Seed ok para ${DEMO_EMAIL}:`, Object.fromEntries(counts));
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Seed falhou:', error);
  process.exit(1);
});
