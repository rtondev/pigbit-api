import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class EmailVerifySendDto {
  @ApiProperty({ example: '12345678000199', description: 'CNPJ do usuário' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos' })
  cnpj: string;
}

export class EmailVerifyValidateDto {
  @ApiProperty({ example: '123456', description: 'Código 6 dígitos enviado por email' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código deve ter 6 dígitos' })
  codigo: string;

  @ApiProperty({ example: '12345678000199', description: 'CNPJ' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve ter 14 dígitos' })
  cnpj: string;
}
