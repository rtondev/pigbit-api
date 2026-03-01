import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { EmailService } from './services/email.service';
import { AuditService } from './services/audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), ConfigModule],
  providers: [EmailService, AuditService],
  exports: [EmailService, AuditService],
})
export class CommonModule {}
