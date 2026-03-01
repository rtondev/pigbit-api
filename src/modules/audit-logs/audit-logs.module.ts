import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditLogsController } from './audit-logs.controller';

@Module({
  imports: [CommonModule, ApiKeysModule],
  controllers: [AuditLogsController],
})
export class AuditLogsModule {}
