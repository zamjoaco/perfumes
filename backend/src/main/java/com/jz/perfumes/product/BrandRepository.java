package com.jz.perfumes.product;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    boolean existsByNameIgnoreCase(String name);
    List<Brand> findAllByOrderByNameAsc();
}
