package com.example.jurisHub.controller;

import com.example.jurisHub.dto.auth.AuthResponse;
import com.example.jurisHub.dto.auth.LoginRequest;
import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.dto.common.ApiResponse;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.mapper.AuthMapper;
import com.example.jurisHub.service.AuthService;
import com.example.jurisHub.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final AuthMapper authMapper;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.ok(authMapper.toSuccessResponse(user, "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        User user = authService.login(request, httpRequest);
        return ResponseEntity.ok(authMapper.toSuccessResponse(user, "User logged in successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request, HttpServletResponse httpResponse) {
        log.info("Logging out user");
        authService.logout(request);
        return ResponseEntity.ok(authMapper.toSuccessMessageResponse("Logout successful"));
    }
}
