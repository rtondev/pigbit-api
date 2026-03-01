import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { Transaction } from '../../entities/transaction.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ProductsModule } from '../products/products.module';
import { NowpaymentsModule } from '../../integrations/nowpayments/nowpayments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Transaction]),
    ProductsModule,
    NowpaymentsModule,
    ApiKeysModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
