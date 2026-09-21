import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import configuration from './config/configuration';
import { User } from './entities/user.entity';
import { Company } from './entities/company.entity';
import { Product } from './entities/product.entity';
import { Invoice } from './entities/invoice.entity';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from './entities/wallet.entity';
import { Withdrawal } from './entities/withdrawal.entity';
import { AuditLog } from './entities/audit-log.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { PendingRegistration } from './entities/pending-registration.entity';
import { PasswordResetCode } from './entities/password-reset-code.entity';
import { FailedLoginAttempt } from './entities/failed-login-attempt.entity';
import { SensitiveChangeCode } from './entities/sensitive-change-code.entity';
import { ApiKey } from './entities/api-key.entity';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { NowpaymentsModule } from './integrations/nowpayments/nowpayments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RealtimeModule } from './realtime/realtime.module';
import { ErrorLogsModule } from './error-logs/error-logs.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CommonModule,
    TypeOrmModule.forFeature([User, Transaction, Invoice]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        entities: [
          User,
          Company,
          Product,
          Invoice,
          Transaction,
          Wallet,
          Withdrawal,
          AuditLog,
          WebhookEvent,
          EmailVerificationCode,
          PendingRegistration,
          PasswordResetCode,
          FailedLoginAttempt,
          SensitiveChangeCode,
          ApiKey,
      ],
        synchronize:
          process.env.NODE_ENV === 'development' ||
          process.env.DB_SYNC === 'true',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    AuditLogsModule,
    ProductsModule,
    InvoicesModule,
    WebhooksModule,
    WalletsModule,
    WithdrawalsModule,
    DashboardModule,
    ApiKeysModule,
    NowpaymentsModule,
    RealtimeModule,
    ErrorLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
