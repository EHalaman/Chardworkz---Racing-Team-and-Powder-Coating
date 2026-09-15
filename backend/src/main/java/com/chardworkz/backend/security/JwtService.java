package com.chardworkz.backend.security;

import com.chardworkz.backend.account.Account;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Issues and validates the app's own JWTs on login - not an OAuth2/OIDC
 * client or resource server, just self-issued tokens per PROJECT-CONTEXT.md's
 * "Spring Security + JWT + Bcrypt" constraint.
 */
@Service
public class JwtService {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_BRANCH_CODE = "branchCode";
    private static final String CLAIM_FULL_NAME = "fullName";
    private static final String CLAIM_ACCOUNT_ID = "accountId";

    @Value("${app.jwt.secret:}")
    private String secret;

    @Value("${app.jwt.expiration-minutes:480}")
    private long expirationMinutes;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "app.jwt.secret is missing or shorter than 32 bytes (256 bits) - required for HS256. "
                    + "Set the JWT_SECRET environment variable before starting the app.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Account account) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(account.getUsername())
            .claim(CLAIM_ROLE, account.getRole().name())
            .claim(CLAIM_BRANCH_CODE, account.getBranch().getCode())
            .claim(CLAIM_FULL_NAME, account.getFullName())
            .claim(CLAIM_ACCOUNT_ID, account.getId())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
            .signWith(signingKey)
            .compact();
    }

    /** Empty if the token is missing, malformed, expired, or fails signature verification. */
    public Optional<Claims> parseClaims(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public String extractRole(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    public String extractBranchCode(Claims claims) {
        return claims.get(CLAIM_BRANCH_CODE, String.class);
    }

    /**
     * Read as {@code Number} rather than {@code Long} directly - JJWT's JSON
     * deserialization returns small numeric claims as {@code Integer}, and a
     * direct {@code claims.get(name, Long.class)} throws on that mismatch.
     */
    public Long extractAccountId(Claims claims) {
        return claims.get(CLAIM_ACCOUNT_ID, Number.class).longValue();
    }
}
