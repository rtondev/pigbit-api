import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private apiKeysService: ApiKeysService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const apiKey = request.headers['x-api-key'] as string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.config.get<string>('jwt.secret'),
        });
        const user = await this.authService.validateUser(payload.sub);
        if (!user) throw new UnauthorizedException('Não autorizado');
        request['user'] = user;
        return true;
      } catch {
        throw new UnauthorizedException('Token inválido ou expirado');
      }
    }

    if (apiKey) {
      const ip =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        request.ip ||
        request.socket?.remoteAddress ||
        '';
      const user = await this.apiKeysService.validate(apiKey, ip);
      if (!user) throw new UnauthorizedException('Chave API inválida');
      request['user'] = user;
      return true;
    }

    throw new UnauthorizedException('Token ou chave API necessários');
  }
}
