package com.chardworkz.backend.realtime;

import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import java.io.IOException;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Open this once per session and keep it open - see
 * docs/realtime-sales-sync-spec-2026-09-25.md. Goes through the same
 * JwtAuthenticationFilter/anyRequest().authenticated() path as every other
 * endpoint; no new auth mechanism. Role/branch scope for this connection is
 * read once at registration time from the same JWT claims every other
 * endpoint already trusts.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class SseEventController {

    private final SseEmitterRegistry registry;
    private final JwtService jwtService;

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        Long accountId = jwtService.extractAccountId(claims);
        String role = jwtService.extractRole(claims);
        String branchCode = jwtService.extractBranchCode(claims);

        // No timeout (0L) - Spring's ~30s default would otherwise close a
        // perfectly healthy idle connection; SseKeepAliveScheduler's periodic
        // ping plus the client's own reconnect logic cover staleness instead.
        SseEmitter emitter = new SseEmitter(0L);
        registry.register(accountId, role, branchCode, emitter);

        try {
            emitter.send(SseEmitter.event().name("CONNECTED").data(Instant.now().toString()));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }
}
