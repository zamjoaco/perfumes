package com.jz.perfumes.sale;

import java.math.BigDecimal;

/** Ventas completadas de un día: cantidad de tickets y total cobrado. */
public record SalesSummary(long count, BigDecimal total) {
}
