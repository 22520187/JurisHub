package com.example.jurisHub.service;

import com.example.jurisHub.dto.forum.NotificationDto;
import com.example.jurisHub.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    NotificationDto createNotification(Long userId, Notification.NotificationType type,
                                       String message, Long relatedEntityId, String relatedEntityType);

    Page<NotificationDto> getUserNotifications(Long userId, Boolean unreadOnly, Pageable pageable);

    NotificationDto markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    long getUnreadCount(Long userId);
}
