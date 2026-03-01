import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    description: 'ID do produto. Se informado, usa valor do produto.',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    example: 100,
    description: 'Valor em BRL. Ignorado se productId for informado.',
  })
  @IsNumber()
  @Min(0)
  valorBrl: number;

  @ApiProperty({
    example: 'btc',
    description: 'Moeda cripto: btc, eth, usdttrc20, etc.',
  })
  @IsString()
  moedaCripto: string;
}
