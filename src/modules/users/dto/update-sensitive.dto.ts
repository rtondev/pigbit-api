import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({ example: '123456', description: 'Código enviado ao e-mail atual' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 'novo@email.com', description: 'Novo e-mail' })
  @IsEmail()
  novoEmail: string;

  @ApiPropertyOptional({ example: '123456', description: 'Código 2FA (se ativado)' })
  @IsOptional()
  @IsString()
  codigo2fa?: string;
}

export class UpdateCnpjDto {
  @ApiProperty({ example: '123456', description: 'Código enviado ao e-mail' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: '12345678000199', description: 'Novo CNPJ 14 dígitos' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos' })
  novoCnpj: string;

  @ApiPropertyOptional({ example: '123456', description: 'Código 2FA (se ativado)' })
  @IsOptional()
  @IsString()
  codigo2fa?: string;
}
