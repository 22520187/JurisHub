package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.auth.LoginRequest;
import com.example.jurisHub.dto.auth.RegisterRequest;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.AuthService;
import com.example.jurisHub.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${app.oauth.redirect-uri-mobile}")
    private String mobileRedirectUri;

    @Override
    public User register(RegisterRequest request) {
        return userService.createUser(request);
    }

    @Override
    public User login(LoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        SecurityContext securityContext = SecurityContextHolder.getContext();
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        return userService.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public void logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    @Override
    public User handleMobileOAuth(String code, String provider) {
        if (!"google".equals(provider)) {
            throw new RuntimeException("Unsupported Oauth provider: " + provider);
        }

        try {
            String accessToken = exchangeCodeForToken(code);
            Map<String, Object> userInfo = getUserInfoFromGoogle(accessToken);

            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");

            User user = userService.findByEmail(email)
                    .orElseGet(() -> {
                        RegisterRequest registerRequest = new RegisterRequest();
                        registerRequest.setEmail(email);
                        registerRequest.setFullName(name);
                        registerRequest.setPassword("OAUTH_USER_" + System.currentTimeMillis());
                        return userService.createUser(registerRequest);
                    });
            log.info("Mobile OAuth login successful for user: {}", email);
            return user;
        } catch (Exception e) {
            log.error("Error during mobile OAuth login: {}", e.getMessage());
            throw new RuntimeException("Mobile OAuth login failed", e);
        }
    }

    private String exchangeCodeForToken(String code) {
        RestTemplate restTemplate = new RestTemplate();
        String tokenEndpoint = "https://oauth2.googleapis.com/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("redirect_uri", mobileRedirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response= restTemplate.exchange(
                tokenEndpoint,
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            if (body == null || !body.containsKey("access_token")) {
                throw new RuntimeException("Failed to get access token from Google");
            }

            return (String) body.get("access_token");
        } catch (Exception e) {
            log.error("Error exchanging code for token: {}", e.getMessage());
            throw new RuntimeException("Failed to exchange authorization code", e);
        }
    }

    private Map<String, Object> getUserInfoFromGoogle(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<String> request = new HttpEntity<>(headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                    userInfoUrl,
                    HttpMethod.GET,
                    request,
                    Map.class
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = response.getBody();
            return userInfo;
        } catch (Exception e) {
            log.error("Error getting user info from Google: ", e);
            throw new RuntimeException("Failed to get user information", e);
        }
    }
}
