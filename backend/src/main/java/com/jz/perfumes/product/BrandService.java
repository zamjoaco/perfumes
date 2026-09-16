package com.jz.perfumes.product;

import com.jz.perfumes.shared.DomainException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brands;

    @Transactional(readOnly = true)
    public List<BrandResponse> list() {
        return brands.findAllByOrderByNameAsc().stream().map(BrandResponse::from).toList();
    }

    @Transactional
    public BrandResponse create(BrandRequest request) {
        String name = request.name().trim();
        if (brands.existsByNameIgnoreCase(name)) {
            throw new DomainException("Ya existe la marca '" + name + "'");
        }
        return BrandResponse.from(brands.save(Brand.create(name)));
    }
}
