package com.chardworkz.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.chardworkz.backend.account.Account;
import com.chardworkz.backend.account.AccountRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Unit coverage for the revocation check added to JwtAuthenticationFilter
 * (security-qa-audit-2026-09-25.md, Ticket 4). Mocks JwtService and
 * AccountRepository directly rather than booting a Spring context or a real
 * database - deliberately, after two other approaches hit environment
 * blockers this session: this app's Spring Boot 4.1.1 build ships a broken
 * TestRestTemplate (references a class removed from Boot 4's own core jar),
 * and the "local" H2 profile can't run past migration V9 (H2's PostgreSQL-
 * compat mode doesn't replicate the implicit CHECK-constraint name V9/V13
 * rely on). A DB-backed integration test remains a good idea if a disposable
 * Postgres test database ever becomes available (the `chardworkz` role
 * currently lacks CREATEDB) - see this file's git history for that attempt.
 */
class JwtAuthenticationFilterTest {

    private static final long ACCOUNT_ID = 1L;
    private static final String TOKEN = "some.jwt.token";

    private final JwtService jwtService = mock(JwtService.class);
    private final AccountRepository accountRepository = mock(AccountRepository.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, accountRepository);
    private final Claims claims = mock(Claims.class);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesAnActiveAccountWithAMatchingTokenVersion() throws Exception {
        stubToken(/* tokenVersion= */ 0);
        when(jwtService.extractRole(claims)).thenReturn("EMPLOYEE");
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(accountWith(true, 0)));

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    /** The exact bug this ticket fixes: a deactivation must reject the account's already-issued token. */
    @Test
    void rejectsATokenBelongingToADeactivatedAccount() throws Exception {
        stubToken(0);
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(accountWith(false, 0)));

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    /** Belt-and-suspenders: even if `active` were somehow still true, a version bump alone must also revoke it. */
    @Test
    void rejectsATokenWhoseVersionNoLongerMatchesTheAccount() throws Exception {
        stubToken(0);
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.of(accountWith(true, 1)));

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void rejectsATokenForAnAccountThatNoLongerExists() throws Exception {
        stubToken(0);
        when(accountRepository.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

        runFilter();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    /** Always calls through the chain regardless of verdict - an unauthenticated request still reaches Spring Security, which is what turns it into a 401 (see SecurityConfig's authenticationEntryPoint). */
    private void runFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + TOKEN);
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        verify(chain).doFilter(any(), any());
    }

    private void stubToken(int tokenVersion) {
        when(jwtService.parseClaims(TOKEN)).thenReturn(Optional.of(claims));
        when(jwtService.extractAccountId(claims)).thenReturn(ACCOUNT_ID);
        when(jwtService.extractTokenVersion(claims)).thenReturn(tokenVersion);
    }

    private Account accountWith(boolean active, int tokenVersion) {
        Account account = new Account();
        account.setActive(active);
        account.setTokenVersion(tokenVersion);
        return account;
    }
}
