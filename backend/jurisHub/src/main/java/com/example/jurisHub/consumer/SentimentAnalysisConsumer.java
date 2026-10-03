package com.example.jurisHub.consumer;

import com.example.jurisHub.config.RabbitMQConfig;
import com.example.jurisHub.dto.messaging.SentimentAnalysisMessage;
import com.example.jurisHub.dto.sentiment.SentimentResult;
import com.example.jurisHub.entity.Notification;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.repository.ForumRepository;
import com.example.jurisHub.repository.PostReplyRepository;
import com.example.jurisHub.repository.UserRepository;
import com.example.jurisHub.service.NotificationService;
import com.example.jurisHub.service.PythonMLClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SentimentAnalysisConsumer {

    private final PythonMLClient pythonMLClient;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final PostReplyRepository postReplyRepository;
    private final ForumRepository forumRepository;

    @RabbitListener(queues = RabbitMQConfig.SENTIMENT_QUEUE)
    public void consumeSentimentTask(SentimentAnalysisMessage message){
        log.info("Received sentiment analysis task for {} id: {}", message.getEntityType(), message.getEntityId());

        try {
            String cleanContent = stripHtml(message.getContent());
            SentimentResult result = pythonMLClient.analyzeSentiment(cleanContent);

            if (result != null) {
                log.info("Sentiment result for {} {}: {} (score: {})",
                        message.getEntityType(), message.getEntityId(), result.getSentiment(), result.getScore());
                if ("POST".equalsIgnoreCase(message.getEntityType())) {
                    forumRepository.findById(message.getEntityId()).ifPresent(post -> {
                        post.setSentimentLabel(result.getSentiment());
                        post.setSentimentScore(result.getScore());

                        if ("negative".equalsIgnoreCase(result.getSentiment())) {
                            post.setIsReported(true);
                            if (post.getReportCount() == null || post.getReportCount() == 0) {
                                post.setReportCount(1);
                            }
                            post.setViolationReason("AI: Phát hiện nội dung tiêu cực - Chờ admin xem xét");
                            notifyAdmins(message, result);
                        }

                        forumRepository.save(post);
                    });
                } else if("REPLY".equalsIgnoreCase(message.getEntityType())) {
                    postReplyRepository.findById(message.getEntityId()).ifPresent(reply -> {
                        reply.setSentimentLabel(result.getSentiment());
                        reply.setSentimentScore(result.getScore());

                        if ("negative".equalsIgnoreCase(result.getSentiment())) {
                            reply.setIsActive(false);
                            notifyAuthor(reply.getAuthor().getId(), "bình luận", reply.getId(), "REPLY");
                            notifyAdmins(message, result);
                        }

                        postReplyRepository.save(reply);
                    });
                }
            } else {
                log.warn("Failed to get sentiment result from Python ML service");
            }
        } catch (Exception e) {
            log.error("Error processing sentiment analysis task: {}", e.getMessage());
        }

    }

    private void notifyAuthor(Long userId, String entityName, Long entityId, String entityType) {
        String alertMessage = String.format("Thông báo: %s của bạn (ID: %s) đã bị tạm ẩn do chứa nội dung không phù hợp theo đánh giá của AI. Bạn vẫn có thể xem nội dung này, nhưng người dùng khác sẽ không thấy.",
                entityName.substring(0, 1).toUpperCase() + entityName.substring(1),
                entityId);

        notificationService.createNotification(
                userId,
                Notification.NotificationType.NEGATIVE_CONTENT_ALERT,
                alertMessage,
                entityId,
                entityType
        );
        log.info("Notified author (ID: {}) about disabled {}", userId, entityName);
    }

    private void notifyAdmins(SentimentAnalysisMessage message, SentimentResult result) {
        log.info("Negative sentiment detected! Notifying admins...");

        List<User> admins = userRepository.findByRole(User.Role.ADMIN);

        String cleanContent = stripHtml(message.getContent());
        String alertMessage = String.format("Cảnh báo nội dung tiêu cực detected bởi AI trong %s (ID: %s). Nội dung: \"%s...\"",
                message.getEntityType().toLowerCase(),
                message.getEntityId(),
                cleanContent.substring(0, Math.min(cleanContent.length(), 50)));

        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    Notification.NotificationType.NEGATIVE_CONTENT_ALERT,
                    alertMessage,
                    message.getEntityId(),
                    message.getEntityType()
            );
        }
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
    }
}
