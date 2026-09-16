package com.jz.perfumes.sale;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @EntityGraph(attributePaths = {"items", "items.product", "items.product.brand"})
    Optional<Sale> findWithItemsById(Long id);

    /** Rango [from, to) siempre presente: el service pone los límites. Los ítems se cargan por @BatchSize. */
    @Query("""
            select s from Sale s
            where s.soldAt >= :from and s.soldAt < :to
              and (:status is null or s.status = :status)
            """)
    Page<Sale> search(@Param("from") Instant from, @Param("to") Instant to,
                      @Param("status") SaleStatus status, Pageable pageable);

    List<Sale> findByStatusAndSoldAtGreaterThanEqualAndSoldAtLessThan(SaleStatus status, Instant from, Instant to);
}
