package com.jz.perfumes.product;

import com.jz.perfumes.shared.DomainException;
import com.jz.perfumes.shared.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository products;
    private final BrandRepository brands;

    @Transactional(readOnly = true)
    public Page<ProductResponse> search(String q, Long brandId, Boolean active, Boolean belowMinimum, Pageable pageable) {
        String query = q == null || q.isBlank() ? null : q.trim();
        return products.search(query, brandId, active, belowMinimum, pageable).map(ProductResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductResponse get(Long id) {
        return ProductResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public ProductSummary summary() {
        return new ProductSummary(products.countByActiveTrue(), products.countActiveBelowMinimum());
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        String sku = Product.normalizeSku(request.sku());
        if (products.existsBySku(sku)) {
            throw new DomainException("Ya existe un producto con el SKU " + sku);
        }
        Product product = Product.builder()
                .sku(sku)
                .brand(findBrand(request.brandId()))
                .name(request.name())
                .concentration(request.concentration())
                .sizeMl(request.sizeMl())
                .presentation(request.presentation())
                .gender(request.gender())
                .fragranceFamily(request.fragranceFamily())
                .costPrice(request.costPrice())
                .salePrice(request.salePrice())
                .minStock(request.minStock())
                .build();
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = find(id);
        String sku = Product.normalizeSku(request.sku());
        if (products.existsBySkuAndIdNot(sku, id)) {
            throw new DomainException("Ya existe otro producto con el SKU " + sku);
        }
        product.update(sku, findBrand(request.brandId()), request.name(), request.concentration(), request.sizeMl(),
                request.presentation(), request.gender(), request.fragranceFamily(),
                request.costPrice(), request.salePrice(), request.minStock());
        return ProductResponse.from(product);
    }

    @Transactional
    public void deactivate(Long id) {
        find(id).deactivate();
    }

    @Transactional
    public ProductResponse activate(Long id) {
        Product product = find(id);
        product.activate();
        return ProductResponse.from(product);
    }

    private Product find(Long id) {
        return products.findWithBrandById(id)
                .orElseThrow(() -> new NotFoundException("Producto no encontrado"));
    }

    private Brand findBrand(Long brandId) {
        return brands.findById(brandId)
                .orElseThrow(() -> new NotFoundException("Marca no encontrada"));
    }
}
