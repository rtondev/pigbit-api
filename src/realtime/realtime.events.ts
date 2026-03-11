/** Evento interno: pedido/fatura (carrinho) teve status atualizado — WebSocket emite para salas checkout:paymentId */
export const INVOICE_STATUS_UPDATED = 'invoice.status.updated';

export type InvoiceStatusPayload = {
  paymentId: string;
  status: string;
  txHash?: string;
};
