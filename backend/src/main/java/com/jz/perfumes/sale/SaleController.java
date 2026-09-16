package com.jz.perfumes.sale;

import com.jz.perfumes.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    /** `from`/`to` son fechas locales (Argentina), inclusive ambas. */
    @GetMapping
    public Page<SaleResponse> search(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                     @RequestParam(required = false) SaleStatus status,
                                     @PageableDefault(size = 20, sort = "soldAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return saleService.search(from, to, status, pageable);
    }

    @GetMapping("/today")
    public SalesSummary today() {
        return saleService.today();
    }

    @GetMapping("/{id}")
    public SaleResponse get(@PathVariable Long id) {
        return saleService.get(id);
    }

    @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request,
                                               @AuthenticationPrincipal AuthenticatedUser user) {
        SaleResponse created = saleService.create(request, user);
        return ResponseEntity.created(URI.create("/api/sales/" + created.id())).body(created);
    }

    @PostMapping("/{id}/cancel")
    public SaleResponse cancel(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        return saleService.cancel(id, user);
    }
}
