package com.chardworkz.backend.account;

import com.chardworkz.backend.audit.ActionType;
import com.chardworkz.backend.audit.ActivityLogService;
import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.realtime.AccountStatusChangedEvent;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.security.LoginResponse;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Staff account management - Owner-only (confirmed with the business owner
 * 2026-09-15, matching the existing Owner-only "Roles" nav tab, DEC-014).
 * This is the app's first real per-role gate: every endpoint before this one
 * only ever checked "is authenticated," never a specific role.
 *
 * <p>{@code /me} and {@code /me/password} are the one exception: they're
 * self-service, so each carries its own {@code @PreAuthorize("isAuthenticated()")}
 * to override this class-level Owner-only default, same pattern as
 * PermissionController#list's Owner+Manager override (security-qa-audit-2026-09-25.md
 * Feature A follow-up - these two were previously unreachable by any non-Owner role).
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class AccountController {

    private final AccountRepository accountRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ActivityLogService activityLogService;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping
    public List<AccountSummaryResponse> list() {
        return accountRepository.findAll().stream().map(AccountSummaryResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<AccountSummaryResponse> create(
        @Valid @RequestBody CreateAccountRequest request, Authentication authentication) {
        if (accountRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        Branch branch = branchRepository.findByCode(request.branchCode())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));

        Instant now = Instant.now();
        Account account = Account.builder()
            .branch(branch)
            .username(request.username())
            .passwordHash(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .role(request.role())
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .build();

        try {
            account = accountRepository.save(account);
        } catch (DataIntegrityViolationException e) {
            // A genuine race on the username unique constraint past the check above.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        activityLogService.record(authentication, ActionType.CREATE, "ACCOUNT", String.valueOf(account.getId()),
            account.getBranch().getId(), "Created " + account.getRole().name().toLowerCase() + " account \"" + account.getUsername() + "\"");

        return ResponseEntity.status(HttpStatus.CREATED).body(AccountSummaryResponse.from(account));
    }

    /**
     * Settings screen's own-profile edit - any authenticated role may call
     * this for their own account (overrides this class's Owner-only default,
     * see the class javadoc). Re-issues the JWT since fullName is baked into
     * its claims (see JwtService) - the old token would keep showing the
     * stale name otherwise, not because the old one is invalid.
     */
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/me")
    public LoginResponse updateProfile(@Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        Account account = currentAccount(authentication);
        account.setFullName(request.fullName());
        account.setUpdatedAt(Instant.now());
        account = accountRepository.save(account);
        return new LoginResponse(
            jwtService.generateToken(account),
            account.getUsername(),
            account.getFullName(),
            account.getRole().name(),
            account.getBranch().getCode());
    }

    /** Self-service, same override as {@link #updateProfile} above. */
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
        @Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        Account account = currentAccount(authentication);
        if (!passwordEncoder.matches(request.currentPassword(), account.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        account.setUpdatedAt(Instant.now());
        accountRepository.save(account);
        return ResponseEntity.noContent().build();
    }

    private Account currentAccount(Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        return accountRepository.findById(jwtService.extractAccountId(claims))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }

    /**
     * Role/branch reassignment for a non-Owner account - deliberately scoped
     * to EMPLOYEE/MANAGER only (never OWNER, either as the target account or
     * the requested role) since promoting/demoting an Owner is a much bigger
     * decision than this simple form should make casually, and self-edit is
     * blocked outright so an Owner can't lock themselves out of their own
     * role, same self-protection rule as {@link #updateStatus}.
     */
    @PatchMapping("/{id}")
    public AccountSummaryResponse update(
        @PathVariable Long id, @Valid @RequestBody UpdateAccountRequest request, Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        if (id.equals(jwtService.extractAccountId(claims))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot edit your own account");
        }
        if (request.role() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot assign the Owner role here");
        }

        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        if (account.getRole() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot edit an Owner account");
        }

        Branch branch = branchRepository.findByCode(request.branchCode())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown branch"));

        account.setFullName(request.fullName());
        account.setRole(request.role());
        account.setBranch(branch);
        // Same reasoning as updateStatus/resetPassword: role/branch are baked
        // into the JWT's claims, so an already-issued token must be rejected
        // immediately or the account keeps acting under its old branch/role
        // for the rest of that token's lifetime (up to 8h) until it happens
        // to log out and back in.
        account.setTokenVersion(account.getTokenVersion() + 1);
        account.setUpdatedAt(Instant.now());
        account = accountRepository.save(account);
        eventPublisher.publishEvent(new AccountStatusChangedEvent(account.getId()));

        activityLogService.record(authentication, ActionType.UPDATE, "ACCOUNT", String.valueOf(account.getId()),
            account.getBranch().getId(),
            "Changed account \"" + account.getUsername() + "\" to " + account.getRole().name().toLowerCase()
                + " @ " + account.getBranch().getCode());

        return AccountSummaryResponse.from(account);
    }

    /**
     * Owner-initiated "forgot password" override - sets a new password without
     * verifying the old one, unlike the self-service /me/password change.
     * Scoped the same as {@link #update}: never the caller's own account (use
     * self-service instead, which does verify the current password) and
     * never an Owner account (Owners manage their own credentials only).
     */
    @PatchMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(
        @PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request, Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        if (id.equals(jwtService.extractAccountId(claims))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use Settings to change your own password");
        }

        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        if (account.getRole() == Role.OWNER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reset an Owner account's password here");
        }

        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        // Same reasoning as updateStatus's deactivation case: forces any
        // session already open with the old password to re-authenticate,
        // since a forgotten/compromised password reset should not leave a
        // stale token still valid.
        account.setTokenVersion(account.getTokenVersion() + 1);
        account.setUpdatedAt(Instant.now());
        accountRepository.save(account);
        // Closes this account's already-open SSE stream(s) too - token_version
        // alone only rejects its *next* REST request (see realtime-sales-sync-spec's
        // Ticket 4 interaction note).
        eventPublisher.publishEvent(new AccountStatusChangedEvent(account.getId()));

        activityLogService.record(authentication, ActionType.UPDATE, "ACCOUNT", String.valueOf(account.getId()),
            account.getBranch().getId(), "Reset password for account \"" + account.getUsername() + "\"");

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public AccountSummaryResponse updateStatus(
        @PathVariable Long id, @Valid @RequestBody UpdateAccountStatusRequest request, Authentication authentication) {
        Claims claims = (Claims) authentication.getDetails();
        if (!request.active() && id.equals(jwtService.extractAccountId(claims))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot deactivate your own account");
        }

        Account account = accountRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
        account.setActive(request.active());
        // Invalidates any token already issued to this account (JwtAuthenticationFilter
        // checks this on every request) so a deactivation takes effect immediately
        // instead of waiting out the token's remaining lifetime.
        account.setTokenVersion(account.getTokenVersion() + 1);
        account.setUpdatedAt(Instant.now());
        account = accountRepository.save(account);
        // Same reasoning as resetPassword above - closes any open SSE stream
        // immediately rather than leaving it open until it naturally times out.
        eventPublisher.publishEvent(new AccountStatusChangedEvent(account.getId()));

        activityLogService.record(authentication, ActionType.UPDATE, "ACCOUNT", String.valueOf(account.getId()),
            account.getBranch().getId(),
            (request.active() ? "Activated" : "Deactivated") + " account \"" + account.getUsername() + "\"");

        return AccountSummaryResponse.from(account);
    }
}
