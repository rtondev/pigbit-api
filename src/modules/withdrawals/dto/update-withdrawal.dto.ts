import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateWithdrawalDto {
  @ApiPropertyOptional({
    example: 'completed',
    description: 'Status: pending, processing, completed, failed',
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'processing', 'completed', 'failed'])
  status?: string;

  @ApiPropertyOptional({
    example: '0xabc123...',
    description: 'Hash da transação blockchain',
  })
  @IsOptional()
  @IsString()
  txHash?: string;
}
