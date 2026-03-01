import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'PIGBIT API - Pagamentos em Criptomoedas';
  }
}
