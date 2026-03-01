import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'lojista@email.com' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;

  @ApiProperty({ example: '12345678000199' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos' })
  cnpj: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsString()
  @MinLength(10, { message: 'Informe um telefone válido' })
  telefone: string;

  @ApiProperty({ example: 'Minha Loja' })
  @IsString()
  @MinLength(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' })
  nomeFantasia: string;

  @ApiProperty({ example: 'Razão Social Ltda', required: false })
  @IsOptional()
  @IsString()
  razaoSocial?: string;

  @ApiProperty({ example: 'Rua X, 123, Centro', required: false })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/, {
    message: 'Senha deve ter maiúscula, número e caractere especial (@$!%*?&#)',
  })
  password: string;
}
