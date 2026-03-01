import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface CnpjLookupResult {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco?: string;
}

@Injectable()
export class CnpjLookupService {
  async lookup(cnpj: string): Promise<CnpjLookupResult> {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) throw new Error('CNPJ deve ter 14 dígitos');
    const { data } = await axios.get(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      { timeout: 10000 },
    );
    const parts: string[] = [];
    if (data.logradouro) parts.push(data.logradouro);
    if (data.numero) parts.push(data.numero);
    if (data.complemento) parts.push(data.complemento);
    if (data.bairro) parts.push(data.bairro);
    if (data.municipio) parts.push(data.municipio);
    if (data.uf) parts.push(data.uf);
    if (data.cep) parts.push(data.cep);
    const endereco = parts.join(', ') || undefined;
    return {
      cnpj: digits,
      razaoSocial: data.razao_social || '',
      nomeFantasia: data.nome_fantasia || undefined,
      endereco,
    };
  }
}
