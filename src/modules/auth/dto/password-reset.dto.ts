import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'lojista@email.com', description: 'E-mail cadastrado' })
  @IsEmail({}, { message: 'Informe um e-mail válido' })
  email: string;
}

export class PasswordResetValidateDto {
  @ApiProperty({ example: '123456', description: 'Código enviado por email' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 'lojista@email.com', description: 'E-mail cadastrado' })
  @IsEmail()
  email: string;
}

export class PasswordResetNewDto {
  @ApiProperty({ example: '123456', description: 'Código de validação' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 'lojista@email.com', description: 'E-mail cadastrado' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha: 8+ chars, maiúscula, número, especial',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/, {
    message: 'Senha deve ter maiúscula, número e caractere especial (@$!%*?&#)',
  })
  novaSenha: string;
}
