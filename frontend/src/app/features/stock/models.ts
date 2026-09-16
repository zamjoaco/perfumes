// Espejo de los records del paquete stock/ del backend.
export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'LOSS';

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolución',
  LOSS: 'Pérdida',
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
