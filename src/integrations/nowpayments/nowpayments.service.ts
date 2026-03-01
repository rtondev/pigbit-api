import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface CreatePaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
}

export interface CreatePaymentResponse {
  payment_id: number | string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  created_at?: string;
  updated_at?: string;
  purchase_id?: number | string;
}

@Injectable()
export class NowpaymentsService {
  private readonly client: AxiosInstance;

  constructor(private config: ConfigService) {
    const apiUrl = this.config.get<string>('nowpayments.apiUrl');
    const apiKey = this.config.get<string>('nowpayments.apiKey');
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  get useSandbox(): boolean {
    return this.config.get<boolean>('nowpayments.useSandbox') ?? true;
  }

  async getCurrencies(): Promise<string[]> {
    const { data } = await this.client.get<{ currencies: string[] }>('/currencies');
    return data?.currencies || [];
  }

  /** Create Payment retorna pay_address e pay_amount. Create Invoice retorna apenas invoice_url. */
  async createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const { data: raw } = await this.client.post<CreatePaymentResponse | { data?: CreatePaymentResponse }>(
      '/payment',
      data,
    );
    const response = (raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: CreatePaymentResponse }).data : raw) as CreatePaymentResponse;
    if (!response?.pay_address || response?.pay_amount == null || response?.payment_id == null) {
      throw new Error(
        `Resposta inválida da NowPayments. Campos recebidos: ${JSON.stringify(Object.keys(raw || {}))}. ` +
        'Confirme: 1) URL (produção: api.nowpayments.io, sandbox: api-sandbox.nowpayments.io) 2) API key do mesmo ambiente 3) Moeda suportada.',
      );
    }
    return response;
  }

  async getPaymentStatus(paymentId: string): Promise<{ payment_status: string }> {
    const { data } = await this.client.get<{ payment_status: string }>(
      `/payment/${paymentId}`,
    );
    return data;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const ipnSecret = this.config.get<string>('nowpayments.ipnSecret');
    const expected = crypto
      .createHmac('sha512', ipnSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  }
}
