import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'lojista@email.com', description: 'E-mail do lojista' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678000199', description: 'CNPJ 14 dígitos' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos' })
  cnpj: string;

  @ApiPropertyOptional({ example: '11999999999', description: 'Telefone' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: 'Minha Loja', description: 'Nome fantasia' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;
}
