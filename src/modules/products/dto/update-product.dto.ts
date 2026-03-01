import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Café Expresso', description: 'Nome' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: 'Café 50ml', description: 'Descrição' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ example: 15.9, description: 'Valor BRL' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valorBrl?: number;
}
