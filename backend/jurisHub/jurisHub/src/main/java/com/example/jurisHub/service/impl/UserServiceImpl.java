package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.mapper.UserMapper;
import com.example.jurisHub.repository.UserRepository;
import com.example.jurisHub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public User createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User findOrCreateOAuth2User(String email, String name, String providerId, String picture) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            userMapper.updateUserFromOAuth2(user, name, providerId, picture);
            return userRepository.save(user);
        }

        User newUser = userMapper.createOAuth2User(email, name, providerId, picture);
        newUser.setPassword(passwordEncoder.encode("oauth2-user-" + System.currentTimeMillis()));

        return userRepository.save(newUser);
    }
}
