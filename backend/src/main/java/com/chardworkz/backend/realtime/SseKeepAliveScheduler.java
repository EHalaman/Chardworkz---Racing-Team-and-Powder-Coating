package com.chardworkz.backend.realtime;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** See SseEmitterRegistry#pingAll - keeps idle SSE connections alive past reverse-proxy/load-balancer silence timeouts. */
@Component
@RequiredArgsConstructor
public class SseKeepAliveScheduler {

    private final SseEmitterRegistry registry;

    @Scheduled(fixedRate = 15_000)
    public void pingAll() {
        registry.pingAll();
    }
}
