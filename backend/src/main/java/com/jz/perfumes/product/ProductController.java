package com.jz.perfumes.product;

import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public Page<ProductResponse> search(@RequestParam(required = false) String q,
                                        @RequestParam(required = false) Long brandId,
                                        @RequestParam(required = false) Boolean active,
                                        @RequestParam(required = false) Boolean belowMinimum,
                                        @PageableDefault(size = 24, sort = "name") Pageable pageable) {
        return productService.search(q, brandId, active, belowMinimum, pageable);
    }

    @GetMapping("/summary")
    public ProductSummary summary() {
        return productService.summary();
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.get(id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse created = productService.create(request);
        return ResponseEntity.created(URI.create("/api/products/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    /** Baja lógica: el producto queda inactivo, nunca se borra. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        productService.deactivate(id);
    }

    @PostMapping("/{id}/activate")
    public ProductResponse activate(@PathVariable Long id) {
        return productService.activate(id);
    }
}
