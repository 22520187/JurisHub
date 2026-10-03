package com.example.jurisHub.repository;

import com.example.jurisHub.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByCreatedAtAfter(LocalDateTime since);

    Page<User> findByRole(User.Role role, Pageable pageable);
    List<User> findByRole(User.Role role);
}
