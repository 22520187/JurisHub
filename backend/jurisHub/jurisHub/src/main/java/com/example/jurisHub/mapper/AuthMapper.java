package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.auth.AuthResponse;
import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthMapper {
    private final UserMapper userMapper;

    public ApiResponse<AuthResponse> toSuccessResponse(User user, String message) {
        AuthResponse authResponse = userMapper.toAuthResponse(user);
        return ApiResponse.success(message, authResponse);
    }

    public ApiResponse<AuthResponse> toSuccessResponse(User user) {
        AuthResponse authResponse = userMapper.toAuthResponse(user);
        return ApiResponse.success(authResponse);
    }

    public ApiResponse<String> toSuccessMessageResponse(String message) {
        return ApiResponse.success(message);
    }
}
