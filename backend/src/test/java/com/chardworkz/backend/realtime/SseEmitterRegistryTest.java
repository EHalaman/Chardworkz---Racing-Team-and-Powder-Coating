package com.chardworkz.backend.realtime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Mockito-based, no Spring context - same reasoning as
 * JwtAuthenticationFilterTest (this app's Boot 4.1.1 build's TestRestTemplate
 * is broken, and the "local" H2 profile can't run migrations past V9; see
 * that test's class javadoc). Covers the two correctness fixes this session
 * made to the original checklist's design: multi-tab support (§Backend
 * implementation plan point 1) and revokeUserStreams actually closing every
 * connection for an account, not just the first.
 */
class SseEmitterRegistryTest {

    private final SseEmitterRegistry registry = new SseEmitterRegistry();

    @Test
    void sendToBranchReachesOwnerRegardlessOfBranch() throws Exception {
        SseEmitter ownerEmitter = mock(SseEmitter.class);
        SseEmitter otherBranchManagerEmitter = mock(SseEmitter.class);
        registry.register(1L, "OWNER", "MAIN", ownerEmitter);
        registry.register(2L, "MANAGER", "MASINAG", otherBranchManagerEmitter);

        registry.sendToBranch("MAIN", "SALE_RECORDED", "payload");

        verify(ownerEmitter).send(any(SseEmitter.SseEventBuilder.class));
        verify(otherBranchManagerEmitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    void sendToBranchReachesOnlyMatchingBranchForNonOwners() throws Exception {
        SseEmitter mainManagerEmitter = mock(SseEmitter.class);
        SseEmitter masinagEmployeeEmitter = mock(SseEmitter.class);
        registry.register(1L, "MANAGER", "MAIN", mainManagerEmitter);
        registry.register(2L, "EMPLOYEE", "MASINAG", masinagEmployeeEmitter);

        registry.sendToBranch("MASINAG", "SALE_RECORDED", "payload");

        verify(mainManagerEmitter, never()).send(any(SseEmitter.SseEventBuilder.class));
        verify(masinagEmployeeEmitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    /** The bug this session's review fixed before it shipped: a second tab/device for the same account must not evict the first. */
    @Test
    void anAccountCanHaveMoreThanOneOpenConnection() throws Exception {
        SseEmitter tab1 = mock(SseEmitter.class);
        SseEmitter tab2 = mock(SseEmitter.class);
        registry.register(1L, "OWNER", "MAIN", tab1);
        registry.register(1L, "OWNER", "MAIN", tab2);

        registry.sendToUser(1L, "SALE_RECORDED", "payload");

        verify(tab1).send(any(SseEmitter.SseEventBuilder.class));
        verify(tab2).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    void revokeUserStreamsClosesEveryConnectionForThatAccountAndOnlyThatAccount() {
        SseEmitter tab1 = mock(SseEmitter.class);
        SseEmitter tab2 = mock(SseEmitter.class);
        SseEmitter otherAccountEmitter = mock(SseEmitter.class);
        registry.register(1L, "EMPLOYEE", "MAIN", tab1);
        registry.register(1L, "EMPLOYEE", "MAIN", tab2);
        registry.register(2L, "EMPLOYEE", "MAIN", otherAccountEmitter);

        registry.revokeUserStreams(1L);

        verify(tab1).complete();
        verify(tab2).complete();
        verify(otherAccountEmitter, never()).complete();
    }

    @Test
    void aClosedConnectionStopsReceivingFurtherEvents() throws Exception {
        SseEmitter emitter = mock(SseEmitter.class);
        registry.register(1L, "OWNER", "MAIN", emitter);

        registry.revokeUserStreams(1L);
        registry.sendToUser(1L, "SALE_RECORDED", "payload");

        verify(emitter).complete();
        verify(emitter, never()).send(any(SseEmitter.SseEventBuilder.class));
    }
}
