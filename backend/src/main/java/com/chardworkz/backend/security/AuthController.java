package com.chardworkz.backend.security;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Account account = accountRepository.findByUsername(request.username()).orElse(null);

        // Same generic message whether the username doesn't exist, the account is
        // inactive, or the password is wrong - never confirm which one it was.
        boolean valid =
            account != null && account.isActive() && passwordEncoder.matches(request.password(), account.getPasswordHash());
        if (!valid) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        String token = jwtService.generateToken(account);
        return ResponseEntity.ok(new LoginResponse(
            token, account.getUsername(), account.getFullName(), account.getRole().name(), account.getBranch().getCode()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        return ResponseEntity.ok(Map.of(
            "username", authentication.getName(),
            "fullName", claims.get("fullName", String.class),
            "role", claims.get("role", String.class),
            "branchCode", claims.get("branchCode", String.class)));
    }
}
