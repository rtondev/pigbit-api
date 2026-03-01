import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: '11999999999', description: 'Telefone' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: 'Minha Loja', description: 'Nome fantasia' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;
}
