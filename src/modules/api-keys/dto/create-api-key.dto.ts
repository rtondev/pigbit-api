import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsIP } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'Integração produção',
    description: 'Nome identificador da chave (ex: servidor, aplicação)',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: ['192.168.1.1', '203.0.113.50'],
    description:
      'IPs permitidos. Omitido = qualquer IP. Com IPs = somente esses IPs',
  })
  @IsOptional()
  @IsArray()
  @IsIP(4, { each: true, message: 'Cada item deve ser um IPv4 válido' })
  allowedIps?: string[];
}
