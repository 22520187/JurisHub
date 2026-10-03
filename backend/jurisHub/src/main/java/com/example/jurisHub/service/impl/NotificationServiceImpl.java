package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.forum.NotificationDto;
import com.example.jurisHub.entity.Notification;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.repository.NotificationRepository;
import com.example.jurisHub.repository.UserRepository;
import com.example.jurisHub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationDto createNotification(Long userId, Notification.NotificationType type,
                                              String message, Long relatedEntityId, String relatedEntityType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .isRead(false)
                .build();
        notification = notificationRepository.save(notification);
        return convertToDto(notification);
    }

    @Override
    public Page<NotificationDto> getUserNotifications(Long userId, Boolean unreadOnly, Pageable pageable) {
        Page<Notification> notifications;

        if (unreadOnly != null && unreadOnly) {
            notifications = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, false, pageable);
        } else {
            notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        return notifications.map(this::convertToDto);
    }

    @Override
    @Transactional
    public NotificationDto markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notification.setIsRead(true);
        notification = notificationRepository.save(notification);
        return convertToDto(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .message(notification.getMessage())
                .relatedEntityId(notification.getRelatedEntityId())
                .relatedEntityType(notification.getRelatedEntityType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
