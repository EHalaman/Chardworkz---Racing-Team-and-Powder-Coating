package com.chardworkz.backend.account;

import com.chardworkz.backend.branch.Branch;
import com.chardworkz.backend.branch.BranchRepository;
import com.chardworkz.backend.security.JwtService;
import com.chardworkz.backend.security.LoginResponse;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    public List<AccountSummaryResponse> list() {
        return accountRepository.findAll().stream().map(AccountSummaryResponse::from).toList();
    }

    @PostMapping
    public ResponseEntity<AccountSummaryResponse> create(@Valid @RequestBody CreateAccountRequest request) {
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

        return ResponseEntity.status(HttpStatus.CREATED).body(AccountSummaryResponse.from(account));
    }

    /**
     * Settings screen's own-profile edit (Owner-only, same as the rest of this
     * controller). Re-issues the JWT since fullName is baked into its claims
     * (see JwtService) - the old token would keep showing the stale name
     * otherwise, not because the old one is invalid.
     */
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
        account.setUpdatedAt(Instant.now());
        return AccountSummaryResponse.from(accountRepository.save(account));
    }
}
