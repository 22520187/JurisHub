package com.example.jurisHub.intercepter;

import com.example.jurisHub.dto.apikey.ApiKeyDto;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.ApiKeyService;
import com.example.jurisHub.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyInterceptor implements HandlerInterceptor {

    private final ApiKeyService apiKeyService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated() ||
                    authentication.getPrincipal().equals("anonymousUser")) {
                return sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "User not authenticated");
            }

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userService.findByEmail(userPrincipal.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            ApiKeyDto apiKey;
            try {
                apiKey = apiKeyService.getApiKeyByUser(user);
            } catch (RuntimeException e) {
                apiKey = apiKeyService.createApiKey(user);
                log.info("Auto-created API key for user: {}", user.getEmail());
            }
            if (apiKey.getRemainingCalls() <= 0 || !apiKey.getIsActive()) {
                return sendErrorResponse(response, 429,
                        "API key limit exceeded. Please upgrade or wait for reset.");
            }

            request.setAttribute("apiKeyInfo", apiKey);
            request.setAttribute("currentUser", user);
            request.setAttribute("shouldDeductApiKey", true); // Mark for deduction

            return true;

        } catch (Exception e) {
            log.error("Error in ApiKeyInterceptor: {}", e.getMessage(), e);
            return sendErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Internal server error");
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        Boolean shouldDeduct = (Boolean) request.getAttribute("shouldDeductApiKey");

        if (shouldDeduct != null && shouldDeduct && response.getStatus() >= 200 && response.getStatus() < 300) {
            try {
                User user = (User) request.getAttribute("currentUser");

                if (user != null) {
                    String path = request.getRequestURI();
                    String type = path.contains("/pdf") ? "pdf" : "chat";

                    apiKeyService.useApiKey(user, type);
                    log.info("Deducted API key usage for user: {}, type: {}", user.getEmail(), type);
                }
            } catch (Exception e) {
                log.error("Error deducting API key usage: {}", e.getMessage(), e);
            }
        }
    }

    private boolean sendErrorResponse(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("data", null);

        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
        return false;
    }
}
