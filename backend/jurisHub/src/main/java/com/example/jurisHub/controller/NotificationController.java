package com.example.jurisHub.controller;

import com.example.jurisHub.dto.forum.NotificationDto;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200"})
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable,
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        Page<NotificationDto> notifications = notificationService.getUserNotifications(userId, unreadOnly, pageable);
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        NotificationDto notification = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();

            if (principal instanceof UserPrincipal) {
                UserPrincipal userPrincipal = (UserPrincipal) principal;
                return userPrincipal.getId();
            }
        }
        throw new RuntimeException("User not authenticated");
    }
}
