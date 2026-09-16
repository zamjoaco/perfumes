package com.jz.perfumes.product;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    @EntityGraph(attributePaths = "brand")
    Optional<Product> findWithBrandById(Long id);

    /** SELECT ... FOR UPDATE: dos movimientos simultáneos sobre el mismo producto se serializan. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> lockById(@Param("id") Long id);

    /** Un solo query para todos los filtros: cada parámetro en null se ignora. */
    @EntityGraph(attributePaths = "brand")
    @Query("""
            select p from Product p
            where (:q is null
                   or lower(p.name) like lower(concat('%', cast(:q as string), '%'))
                   or lower(p.sku) like lower(concat('%', cast(:q as string), '%'))
                   or lower(p.brand.name) like lower(concat('%', cast(:q as string), '%')))
              and (:brandId is null or p.brand.id = :brandId)
              and (:active is null or p.active = :active)
              and (:belowMinimum is null
                   or (:belowMinimum = true and p.currentStock <= p.minStock)
                   or (:belowMinimum = false and p.currentStock > p.minStock))
            """)
    Page<Product> search(@Param("q") String q,
                         @Param("brandId") Long brandId,
                         @Param("active") Boolean active,
                         @Param("belowMinimum") Boolean belowMinimum,
                         Pageable pageable);

    long countByActiveTrue();

    @Query("select count(p) from Product p where p.active = true and p.currentStock <= p.minStock")
    long countActiveBelowMinimum();
}
