package com.jz.perfumes.stock;

import java.math.BigDecimal;
import java.time.Instant;

public record MovementResponse(Long id, MovementType type, int quantity, int stockAfter, BigDecimal unitCost,
                               Long referenceId, String reason, Instant createdAt) {

    public static MovementResponse from(StockMovement m) {
        return new MovementResponse(m.getId(), m.getMovementType(), m.getQuantity(), m.getStockAfter(),
                m.getUnitCost(), m.getReferenceId(), m.getReason(), m.getCreatedAt());
    }
}
