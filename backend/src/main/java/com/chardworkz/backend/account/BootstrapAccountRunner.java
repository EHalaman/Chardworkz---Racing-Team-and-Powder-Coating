package com.chardworkz.backend.account;

import com.chardworkz.backend.branch.BranchRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Creates exactly one bootstrap Owner account, and only if the {@code account}
 * table is completely empty - a fresh system otherwise has no way to log in
 * and create further accounts. Never overwrites or touches an existing
 * account. Credentials come from environment variables only - never
 * hardcoded, never committed (see application-local.properties for the
 * dev-only defaults, clearly marked as such).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BootstrapAccountRunner implements ApplicationRunner {

    private final AccountRepository accountRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-owner.username:}")
    private String bootstrapUsername;

    @Value("${app.bootstrap-owner.password:}")
    private String bootstrapPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (accountRepository.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(bootstrapUsername) || !StringUtils.hasText(bootstrapPassword)) {
            log.warn(
                "No accounts exist yet and no bootstrap owner is configured. Set "
                    + "BOOTSTRAP_OWNER_USERNAME and BOOTSTRAP_OWNER_PASSWORD and restart to create the first Owner account.");
            return;
        }

        var mainBranch = branchRepository.findByCode("MAIN")
            .orElseThrow(() -> new IllegalStateException("MAIN branch not seeded - check V2__seed_branches.sql ran"));

        Instant now = Instant.now();
        accountRepository.save(Account.builder()
            .branch(mainBranch)
            .username(bootstrapUsername)
            .passwordHash(passwordEncoder.encode(bootstrapPassword))
            .fullName("Bootstrap Owner")
            .role(Role.OWNER)
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .build());
        log.info("Created bootstrap Owner account '{}'. Change this password immediately.", bootstrapUsername);
    }
}
