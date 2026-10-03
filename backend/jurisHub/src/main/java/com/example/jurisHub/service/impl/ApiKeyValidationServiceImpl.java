package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.apikey.ApiKeyDto;
import com.example.jurisHub.entity.ApiKey;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.repository.UserRepository;
import com.example.jurisHub.service.ApiKeyService;
import com.example.jurisHub.service.ApiKeyValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKeyValidationServiceImpl implements ApiKeyValidationService {
    private final ApiKeyService apiKeyService;
    private final UserRepository userRepository;

    /**
     * Validate and deduct API key for a user
     * @param userId User ID
     * @param type API type ("pdf" or "chat")
     * @throws RuntimeException if validation fails
     */

    public void validateAndUseApiKey(Long userId, String type) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ApiKeyDto apiKey;
            try {
                apiKey = apiKeyService.getApiKeyByUser(user);
            } catch (RuntimeException e) {
                apiKey = apiKeyService.createApiKey(user);
                log.info("Auto-created API key for user: {}", user.getEmail());
            }

            if (!apiKey.getIsActive()) {
                throw new RuntimeException("API key is inactive");
            }

            if (apiKey.getRemainingCalls() <= 0) {
                throw new RuntimeException("API key limit exceeded. Please upgrade or wait for reset.");
            }

            apiKeyService.useApiKey(user, type);
            log.info("Successfully validated and deducted API key for user: {}, type: {}, remaining: {}",
                    user.getEmail(), type, apiKey.getRemainingCalls() - 1);
        } catch (Exception e) {
            log.error("API key validation failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

}
