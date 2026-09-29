package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.apikey.ApiKeyDto;
import com.example.jurisHub.entity.ApiKey;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.repository.ApiKeyRepository;
import com.example.jurisHub.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ApiKeyServiceImpl implements ApiKeyService {
    private final ApiKeyRepository apiKeyRepository;
    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    @Override
    public ApiKeyDto createApiKey(User user) {
        var existingKey = apiKeyRepository.findByUserAndIsActiveTrue(user);
        if (existingKey.isPresent()) {
            return mapToDto(existingKey.get());
        }
        String key = generateApiKey();
        while (apiKeyRepository.existsByKey(key)) {
            key = generateApiKey();
        }

        ApiKey apiKey = ApiKey.builder()
                .user(user)
                .key(key)
                .totalLimit(5)
                .usedCount(0)
                .pdfQaCount(0)
                .chatQaCount(0)
                .isActive(true)
                .build();
        apiKey = apiKeyRepository.save(apiKey);
        log.info("Created API key for user: {}", user.getEmail());

        return mapToDto(apiKey);
    }

    @Override
    @Transactional(readOnly = true)
    public ApiKeyDto getApiKeyByUser(User user) {
        ApiKey apiKey = apiKeyRepository.findByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new RuntimeException("No active API key found for user: " + user.getEmail()));
        return mapToDto(apiKey);
    }

    @Override
    public ApiKeyDto useApiKey(User user, String type) {
        ApiKey apiKey = apiKeyRepository.findByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new RuntimeException("Api key not found"));
        if (apiKey.hasRemainingCalls()) {
            throw new RuntimeException("API key limit exceeded or expired");
        }
        apiKey.incrementUsage(type);
        apiKey = apiKeyRepository.save(apiKey);
        log.info("Used API key for user: {}, type: {}, remaining: {}",
                user.getEmail(), type, apiKey.getRemainingCalls());
        return mapToDto(apiKey);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean validateApiKey(String apiKey) {
        return apiKeyRepository.findByKey(apiKey)
                .map(ApiKey::hasRemainingCalls)
                .orElse(false);

    }

    private String generateApiKey() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return "lc_" + base64Encoder.encodeToString(randomBytes);
    }

    private ApiKeyDto mapToDto(ApiKey apiKey) {
        return ApiKeyDto.builder()
                .id(apiKey.getId())
                .key(apiKey.getKey())
                .totalLimit(apiKey.getTotalLimit())
                .usedCount(apiKey.getUsedCount())
                .pdfQaCount(apiKey.getPdfQaCount())
                .chatQaCount(apiKey.getChatQaCount())
                .remainingCalls(apiKey.getRemainingCalls())
                .isActive(apiKey.getIsActive())
                .createdAt(apiKey.getCreatedAt())
                .expiresAt(apiKey.getExpiresAt())
                .build();
    }
}
