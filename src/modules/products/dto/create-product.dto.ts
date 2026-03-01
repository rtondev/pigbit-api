import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Café Expresso', description: 'Nome do produto' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    example: 'Café 50ml',
    description: 'Descrição opcional do produto',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 15.9, description: 'Valor fixo em BRL' })
  @IsNumber()
  @Min(0)
  valorBrl: number;
}
