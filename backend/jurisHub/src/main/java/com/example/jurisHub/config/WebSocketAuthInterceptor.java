package com.example.jurisHub.config;

import com.example.jurisHub.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.security.Principal;
import java.util.Map;

@Slf4j
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor, HandshakeInterceptor {
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpServletRequest httpRequest = servletRequest.getServletRequest();
            HttpSession session = httpRequest.getSession(false);

            if (session != null) {
                Object securityContextObj = session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
                if (securityContextObj != null) {
                    attributes.put("SPRING_SECURITY_CONTEXT", securityContextObj);
                    log.info("WebSocket handshake with authenticated session: {}", session.getId());
                    return true;
                }
            }

            log.warn("WebSocket handshake without valid session authentication");
        }

        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("WebSocket CONNECT attempt: session={}, headers={}", accessor.getSessionId(), accessor.toNativeHeaderMap());

            String userName = accessor.getFirstNativeHeader("user-name");
            if (userName != null && !userName.isEmpty()) {
                accessor.setUser(new Principal() {
                    @Override
                    public String getName() {
                        return userName;
                    }
                });
                log.info("WebSocket CONNECT with user-name header: {}", userName);
            } else {
                Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
                if (sessionAttrs == null) {
                    log.warn("WebSocket CONNECT: no session attributes available for session={}", accessor.getSessionId());
                } else {
                    Object securityContextObj = sessionAttrs.get("SPRING_SECURITY_CONTEXT");
                    if (securityContextObj != null) {
                        try {
                            SecurityContext securityContext = (SecurityContext) securityContextObj;
                            Authentication authentication = securityContext.getAuthentication();

                            if (authentication != null && authentication.isAuthenticated()) {
                                accessor.setUser(new Principal() {
                                    @Override
                                    public String getName() {
                                        Object principalObj = authentication.getPrincipal();
                                        if (principalObj instanceof UserPrincipal) {
                                            UserPrincipal user = (UserPrincipal) principalObj;
                                            return user.getEmail();
                                        }
                                        return authentication.getName();
                                    }
                                });
                                log.info("WebSocket CONNECT with authenticated user: {}", accessor.getUser().getName());
                            }
                        } catch (Exception e) {
                            log.error("Error setting WebSocket authentication", e);
                        }
                    } else {
                        log.warn("WebSocket CONNECT without authentication and no user-name header (sessionAttrs present but no security context)");
                    }
                }
            }
        }

        return message;
    }
}
