package com.chardworkz.backend.account;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Account> findByBranchIdOrderByFullName(Long branchId);

    List<Account> findAllByOrderByFullName();
}
