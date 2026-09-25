package com.chardworkz.backend.realtime;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class RealtimeEventListeners {

    private final SseEmitterRegistry registry;

    /**
     * AFTER_COMMIT, not the default (immediately, synchronously in-transaction) -
     * SaleService#recordSale is @Transactional, and broadcasting before that
     * transaction actually commits risks a subscriber refetching and finding
     * nothing yet, or the event firing right before a rollback. See
     * docs/realtime-sales-sync-spec-2026-09-25.md.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSaleCreated(SaleCreatedEvent event) {
        registry.sendToBranch(event.branchCode(), "SALE_RECORDED", event);
    }

    /** Not transactional - AccountController's own methods already commit the token_version bump before returning; this just needs to run after that, which a plain @EventListener already guarantees since events publish synchronously by default. */
    @EventListener
    public void onAccountStatusChanged(AccountStatusChangedEvent event) {
        registry.revokeUserStreams(event.accountId());
    }
}
