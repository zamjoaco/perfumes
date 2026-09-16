package com.jz.perfumes.stock;

import com.jz.perfumes.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products/{productId}/movements")
@RequiredArgsConstructor
public class StockController {

    private final StockService stockService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovementResponse register(@PathVariable Long productId,
                                     @Valid @RequestBody MovementRequest request,
                                     @AuthenticationPrincipal AuthenticatedUser user) {
        return stockService.register(productId, request, user);
    }

    @GetMapping
    public Page<MovementResponse> history(@PathVariable Long productId,
                                          @PageableDefault(size = 20) Pageable pageable) {
        return stockService.history(productId, pageable);
    }
}
