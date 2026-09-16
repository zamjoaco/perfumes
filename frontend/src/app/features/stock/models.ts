// Espejo de los records del paquete stock/ del backend.
export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'LOSS';

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolución',
  LOSS: 'Pérdida',
};

/** Qué significa cada tipo, para el diálogo. */
export const MOVEMENT_HELP: Record<MovementType, string> = {
  PURCHASE: 'Entra mercadería que compraste. Suma al stock.',
  SALE: 'La genera una venta. No se carga a mano.',
  ADJUSTMENT: 'Corregí el stock tras un conteo: cantidad positiva suma, negativa resta.',
  RETURN: 'Un cliente devolvió un producto. Suma al stock.',
  LOSS: 'Rotura, vencimiento o faltante. Resta del stock.',
};

/** Los que se cargan a mano; SALE lo genera la venta. */
export const MANUAL_MOVEMENT_TYPES: MovementType[] = ['PURCHASE', 'ADJUSTMENT', 'RETURN', 'LOSS'];

export interface MovementRequest {
  type: MovementType;
  quantity: number; // con signo solo para ADJUSTMENT
  unitCost: string | null;
  reason: string | null;
}

export interface MovementResponse {
  id: number;
  type: MovementType;
  quantity: number;
  stockAfter: number;
  unitCost: number | null;
  referenceId: number | null;
  reason: string | null;
  createdAt: string;
}
