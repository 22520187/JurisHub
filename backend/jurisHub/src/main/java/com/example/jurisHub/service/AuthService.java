package com.example.jurisHub.service;

import com.example.jurisHub.dto.auth.LoginRequest;
import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.entity.User;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    User register(RegisterRequest request);

    User login(LoginRequest request, HttpServletRequest httpRequest);

    void logout(HttpServletRequest httpRequest);

    User handleMobileOAuth(String code, String provider);
}
