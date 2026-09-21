package com.example.jurisHub.service;

import com.example.jurisHub.dto.forum.NotificationDto;
import com.example.jurisHub.entity.Notification;

public interface NotificationService {
    NotificationDto createNotification(Long userId, Notification.NotificationType type,
                                       String message, Long relatedEntityId, String relatedEntityType);
}
