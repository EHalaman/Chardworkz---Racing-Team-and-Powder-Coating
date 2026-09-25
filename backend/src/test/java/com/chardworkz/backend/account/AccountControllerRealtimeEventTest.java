package com.chardworkz.backend.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.realtime.AccountStatusChangedEvent;
import com.chardworkz.backend.security.JwtService;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

/**
 * QA pass, Phase 4, scenario 8 (docs/realtime-sales-sync-spec-2026-09-25.md):
 * SseEmitterRegistryTest already covers revokeUserStreams() closing every
 * connection for an account, but nothing verified that AccountController
 * actually *publishes* AccountStatusChangedEvent in the first place - this
 * closes that gap. Mockito-based, no Spring context, same reasoning as this
 * package's other tests this session.
 */
class AccountControllerRealtimeEventTest {

    private static final Long CALLER_ID = 1L;
    private static final Long TARGET_ID = 2L;

    private final AccountRepository accountRepository = mock(AccountRepository.class);
    private final BranchRepository branchRepository = mock(BranchRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final JwtService jwtService = mock(JwtService.class);
    private final com.chardworkz.backend.audit.ActivityLogService activityLogService =
        mock(com.chardworkz.backend.audit.ActivityLogService.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

    private final AccountController controller = new AccountController(
        accountRepository, branchRepository, passwordEncoder, jwtService, activityLogService, eventPublisher);

    private final Authentication authentication = mock(Authentication.class);
    private final Claims claims = mock(Claims.class);

    @Test
    void deactivatingAnAccountPublishesAnAccountStatusChangedEventForThatAccount() {
        when(authentication.getDetails()).thenReturn(claims);
        when(jwtService.extractAccountId(claims)).thenReturn(CALLER_ID);
        when(accountRepository.findById(TARGET_ID)).thenReturn(Optional.of(targetAccount()));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        controller.updateStatus(TARGET_ID, new UpdateAccountStatusRequest(false), authentication);

        ArgumentCaptor<Object> published = ArgumentCaptor.forClass(Object.class);
        verify(eventPublisher).publishEvent(published.capture());
        assertThat(published.getValue()).isEqualTo(new AccountStatusChangedEvent(TARGET_ID));
    }

    @Test
    void reactivatingAnAccountAlsoPublishesTheEvent() {
        when(authentication.getDetails()).thenReturn(claims);
        when(jwtService.extractAccountId(claims)).thenReturn(CALLER_ID);
        when(accountRepository.findById(TARGET_ID)).thenReturn(Optional.of(targetAccount()));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        controller.updateStatus(TARGET_ID, new UpdateAccountStatusRequest(true), authentication);

        verify(eventPublisher).publishEvent(new AccountStatusChangedEvent(TARGET_ID));
    }

    @Test
    void resettingAPasswordPublishesAnAccountStatusChangedEventForThatAccount() {
        when(authentication.getDetails()).thenReturn(claims);
        when(jwtService.extractAccountId(claims)).thenReturn(CALLER_ID);
        when(accountRepository.findById(TARGET_ID)).thenReturn(Optional.of(targetAccount()));
        when(passwordEncoder.encode("a-new-temp-password")).thenReturn("hashed");

        controller.resetPassword(TARGET_ID, new ResetPasswordRequest("a-new-temp-password"), authentication);

        verify(eventPublisher).publishEvent(new AccountStatusChangedEvent(TARGET_ID));
    }

    /** Guards the guard: a rejected self-deactivation must never reach the event publish - it should fail before that point, same as it fails before the token_version bump. */
    @Test
    void aRejectedSelfDeactivationNeverPublishesAnEvent() {
        when(authentication.getDetails()).thenReturn(claims);
        when(jwtService.extractAccountId(claims)).thenReturn(CALLER_ID);

        try {
            controller.updateStatus(CALLER_ID, new UpdateAccountStatusRequest(false), authentication);
        } catch (ResponseStatusException expected) {
            // Expected - self-deactivation is blocked before any event publish.
        }

        verifyNoInteractions(eventPublisher);
    }

    private Account targetAccount() {
        Branch branch = Branch.builder().id(1L).code("MAIN").name("Main Branch").build();
        return Account.builder()
            .id(TARGET_ID)
            .branch(branch)
            .username("target-user")
            .fullName("Target User")
            .role(Role.EMPLOYEE)
            .active(true)
            .passwordHash("old-hash")
            .tokenVersion(0)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }
}
