import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: '1', description: 'ID da carteira de destino' })
  @IsString()
  walletId: string;

  @ApiProperty({ example: 100, description: 'Valor em BRL' })
  @IsNumber()
  @Min(0.01)
  amountBrl: number;
}
