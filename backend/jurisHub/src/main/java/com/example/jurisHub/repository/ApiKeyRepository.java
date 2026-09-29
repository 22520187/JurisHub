package com.example.jurisHub.repository;

import com.example.jurisHub.entity.ApiKey;
import com.example.jurisHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    Optional<ApiKey> findByKey(String key);

    Optional<ApiKey> findByUserAndIsActiveTrue(User user);

    boolean existsByKey(String key);
}
