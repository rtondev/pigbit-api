import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'lojista@email.com', description: 'E-mail cadastrado' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha do usuário' })
  @IsString()
  password: string;
}
