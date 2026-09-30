package com.example.jurisHub.service;

public interface ApiKeyValidationService {

    void validateAndUseApiKey(Long userId, String type);

}
