package com.chardworkz.backend.security;

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
 * Trusts the JWT's own claims (role, branch, full name) rather than hitting
 * the database on every request - the token is the source of truth for the
 * lifetime of its expiration window.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            Optional<Claims> claims = jwtService.parseClaims(token);
            if (claims.isPresent() && SecurityContextHolder.getContext().getAuthentication() == null) {
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
}
