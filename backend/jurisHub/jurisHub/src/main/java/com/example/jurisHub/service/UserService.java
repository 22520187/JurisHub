package com.example.jurisHub.service;

import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.entity.User;

import java.util.Optional;

public interface UserService {
    User createUser(RegisterRequest request);

    Optional<User> findByEmail(String email);

    User findOrCreateOAuth2User(String email, String name, String providerId, String picture);

}
