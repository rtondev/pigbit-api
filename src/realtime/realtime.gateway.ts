import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';
import { INVOICE_STATUS_UPDATED } from './realtime.events';
import type { InvoiceStatusPayload } from './realtime.events';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit() {
    this.logger.log('WebSocket /realtime pronto (checkout + monitoramento)');
  }

  /**
   * Cliente entra na sala do paymentId para receber atualizações
   * assim que o webhook alterar o status do pedido (carrinho → pago).
   */
  @SubscribeMessage('subscribeCheckout')
  handleSubscribeCheckout(client: Socket, paymentId: string) {
    if (!paymentId || typeof paymentId !== 'string') {
      return { ok: false, error: 'paymentId obrigatório' };
    }
    const room = `checkout:${paymentId}`;
    client.join(room);
    this.logger.debug(`Cliente ${client.id} inscrito em ${room}`);
    return { ok: true, room };
  }

  /**
   * Monitoramento: sala global para dashboard (opcional; sem auth aqui — use com cautela em prod).
   * Eventos de webhook processados podem ser emitidos para admins autenticados em evolução futura.
   */
  @SubscribeMessage('subscribeHealth')
  handleSubscribeHealth(client: Socket) {
    client.join('health');
    return { ok: true };
  }

  @OnEvent(INVOICE_STATUS_UPDATED)
  onInvoiceStatusUpdated(payload: InvoiceStatusPayload) {
    if (!payload?.paymentId) return;
    this.server.to(`checkout:${payload.paymentId}`).emit('invoiceStatus', payload);
    // Feedback em tempo real para quem acompanha o serviço
    this.server.to('health').emit('serviceEvent', {
      type: 'invoice.status',
      paymentId: payload.paymentId,
      status: payload.status,
      at: new Date().toISOString(),
    });
  }
}
