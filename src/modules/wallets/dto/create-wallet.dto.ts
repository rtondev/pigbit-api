import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ example: '0x123...abc', description: 'Endereço da carteira' })
  @IsString()
  endereco: string;

  @ApiProperty({ example: 'btc', description: 'Moeda: btc, eth, usdttrc20, etc' })
  @IsString()
  moeda: string;
}
