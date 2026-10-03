package com.example.jurisHub.controller;

import com.example.jurisHub.dto.apikey.ApiKeyDto;
import com.example.jurisHub.dto.apikey.ApiKeyUsageRequest;
import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.ApiKeyService;
import com.example.jurisHub.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/api-keys")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4200"})
public class ApiKeyController {

    private UserService userService;
    private ApiKeyService apiKeyService;

    @PostMapping
    public ResponseEntity<ApiResponse<ApiKeyDto>> createApiKey(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        ApiKeyDto apiKey = apiKeyService.createApiKey(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ApiKeyDto>builder()
                        .success(true)
                        .message("API key created successfully")
                        .data(apiKey)
                        .build());

    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ApiKeyDto>> getMyApiKey(Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        ApiKeyDto apiKey = apiKeyService.getApiKeyByUser(user);

        return ResponseEntity.ok(ApiResponse.<ApiKeyDto>builder()
                .success(true)
                .message("API key retrieved successfully")
                .data(apiKey)
                .build());
    }

    @PutMapping("/use")
    public ResponseEntity<ApiResponse<ApiKeyDto>> useApiKey(@RequestBody ApiKeyUsageRequest request,
                                                            Authentication authentication) {
        User user = getUserFromAuthentication(authentication);
        ApiKeyDto apiKey = apiKeyService.useApiKey(user, request.getType());

        return ResponseEntity.ok(ApiResponse.<ApiKeyDto>builder()
                .success(true)
                .message("API key usage updated successfully")
                .data(apiKey)
                .build());
    }

    @GetMapping("/validate/{key}")
    public ResponseEntity<ApiResponse<Boolean>> validateApiKey(@PathVariable String key) {
        boolean isValid = apiKeyService.validateApiKey(key);

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .success(true)
                .message(isValid ? "API key is valid" : "API key is invalid or expired")
                .data(isValid)
                .build());
    }

    private User getUserFromAuthentication(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return userService.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

}
