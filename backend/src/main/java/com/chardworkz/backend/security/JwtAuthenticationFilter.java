package com.chardworkz.backend.security;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Trusts the JWT's role/branch/full-name claims rather than re-reading them
 * from the database on every request. Account status is the one exception:
 * it does one lookup per request to confirm the account is still active and
 * its token_version still matches the claim, so a deactivation (or any other
 * status change - see AccountController#updateStatus) takes effect on the
 * account's very next request instead of waiting out the token's remaining
 * lifetime (security-qa-audit-2026-09-25.md, Ticket 4).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final AccountRepository accountRepository;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            Optional<Claims> claims = jwtService.parseClaims(token);
            if (claims.isPresent()
                && SecurityContextHolder.getContext().getAuthentication() == null
                && isSessionStillValid(claims.get())) {
                String username = claims.get().getSubject();
                String role = jwtService.extractRole(claims.get());
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                var authentication =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);
                authentication.setDetails(claims.get());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    /** False leaves the request unauthenticated, which the security config turns into a 401. */
    private boolean isSessionStillValid(Claims claims) {
        Account account = accountRepository.findById(jwtService.extractAccountId(claims)).orElse(null);
        return account != null
            && account.isActive()
            && account.getTokenVersion() == jwtService.extractTokenVersion(claims);
    }
}
