import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: '0x123...abc', description: 'Endereço da carteira' })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({ example: 'btc', description: 'Moeda: btc, eth, usdttrc20, etc' })
  @IsOptional()
  @IsString()
  moeda?: string;

  @ApiPropertyOptional({ example: true, description: 'Carteira ativa para saques' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
