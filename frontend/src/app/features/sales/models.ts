import { SelectOption } from '../../shared/ui';

// Espejo de los records del paquete sale/ del backend.
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MP';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  MP: 'Mercado Pago',
};
export const STATUS_LABELS: Record<SaleStatus, string> = { COMPLETED: 'Completada', CANCELLED: 'Cancelada' };

export const PAYMENT_OPTIONS: SelectOption[] = (Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][]).map(
  ([value, label]) => ({ value, label }),
);

export interface SaleItemRequest {
  productId: number;
  quantity: number;
}

/** Sin total: lo calcula el backend con los precios actuales. */
export interface SaleRequest {
  items: SaleItemRequest[];
  paymentMethod: PaymentMethod;
  discount: string | null;
  notes: string | null;
  soldAt: string | null;
}

export interface SaleItemResponse {
  productId: number;
  productName: string;
  brand: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  soldAt: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string | null;
  itemCount: number;
  items: SaleItemResponse[];
}

export interface SalesSummary {
  count: number;
  total: number;
}
