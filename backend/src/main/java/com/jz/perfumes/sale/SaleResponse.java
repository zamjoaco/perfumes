package com.jz.perfumes.sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SaleResponse(Long id, Instant soldAt, BigDecimal subtotal, BigDecimal discount, BigDecimal total,
                           PaymentMethod paymentMethod, SaleStatus status, String notes, int itemCount,
                           List<SaleItemResponse> items) {

    public static SaleResponse from(Sale s) {
        return new SaleResponse(s.getId(), s.getSoldAt(), s.getSubtotal(), s.getDiscount(), s.getTotal(),
                s.getPaymentMethod(), s.getStatus(), s.getNotes(),
                s.getItems().stream().mapToInt(SaleItem::getQuantity).sum(),
                s.getItems().stream().map(SaleItemResponse::from).toList());
    }
}
