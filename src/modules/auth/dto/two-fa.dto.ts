import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, IsEmail } from 'class-validator';

export class TwoFaVerifyDto {
  @ApiProperty({ example: '123456', description: 'Código 6 dígitos do Authenticator' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código deve ter 6 dígitos' })
  codigo: string;
}

export class TwoFaLoginDto {
  @ApiProperty({ example: 'lojista@email.com', description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Código 6 dígitos do Authenticator' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código deve ter 6 dígitos' })
  codigo: string;
}
