package com.chardworkz.backend.config;

import com.chardworkz.backend.security.JwtAuthenticationFilter;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless JWT auth per PROJECT-CONTEXT.md ("Spring Security + JWT + Bcrypt
 * auth, uniform across all roles"). {@code @EnableMethodSecurity} is on so
 * real endpoints can use {@code @PreAuthorize("hasRole('OWNER')")} etc. once
 * they exist - no business endpoints exist yet beyond /api/ping and
 * /api/auth/**, so no per-role rules are wired up here yet.
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // Angular's dev server runs on a different origin (localhost:4200) than
    // this API (localhost:8080), so the browser enforces CORS even for local
    // development - blank by default in production, where the frontend is
    // expected to be served same-origin and no cross-origin allowance is needed.
    @Value("${app.cors.allowed-origin:}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/ping", "/api/auth/login").permitAll()
                .requestMatchers("/h2-console/**").permitAll() // dev-only H2 console, see application-local.properties
                // A ResponseStatusException (e.g. SaleService's validation errors) triggers
                // an internal servlet forward to /error; OncePerRequestFilter skips ERROR
                // dispatches by default, so JwtAuthenticationFilter never re-runs there and
                // the forwarded request would otherwise 401 instead of surfacing the real
                // status code.
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jsonUnauthorizedEntryPoint()))
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin())) // required for the H2 console above
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        if (!allowedOrigin.isBlank()) {
            config.setAllowedOrigins(List.of(allowedOrigin));
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
            config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
            // Without this the browser caches a preflight for only ~5s, so every API call
            // from the Vercel-hosted frontend paid an extra OPTIONS round trip to the backend.
            config.setMaxAge(Duration.ofHours(1));
        }
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private AuthenticationEntryPoint jsonUnauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(401);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\"}");
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
