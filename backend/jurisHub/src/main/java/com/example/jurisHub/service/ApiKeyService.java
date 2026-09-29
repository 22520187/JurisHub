package com.example.jurisHub.service;

import com.example.jurisHub.dto.apikey.ApiKeyDto;
import com.example.jurisHub.entity.User;

public interface ApiKeyService {
    ApiKeyDto createApiKey(User user);

    ApiKeyDto getApiKeyByUser(User user);

    ApiKeyDto useApiKey(User user, String type);

    boolean validateApiKey(String key);
}
