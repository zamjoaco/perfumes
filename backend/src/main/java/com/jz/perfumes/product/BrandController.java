package com.jz.perfumes.product;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    public List<BrandResponse> list() {
        return brandService.list();
    }

    @PostMapping
    public ResponseEntity<BrandResponse> create(@Valid @RequestBody BrandRequest request) {
        BrandResponse created = brandService.create(request);
        return ResponseEntity.created(URI.create("/api/brands/" + created.id())).body(created);
    }
}
