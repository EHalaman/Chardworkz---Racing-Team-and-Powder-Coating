package com.chardworkz.backend.sales;

import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sync target for the Angular offline sale queue (Q12). Branch and employee
 * are always derived from the caller's JWT, never trusted from the request
 * body - see {@link SaleService#recordSale}.
 */
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final JwtService jwtService;

    @PostMapping
    public ResponseEntity<SaleAckResponse> create(
        @Valid @RequestBody CreateSaleRequest request, Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        String branchCode = jwtService.extractBranchCode(claims);
        Long employeeId = jwtService.extractAccountId(claims);

        SaleAckResponse response = saleService.recordSale(request, branchCode, employeeId);
        HttpStatus status = response.alreadySynced() ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(response);
    }
}
