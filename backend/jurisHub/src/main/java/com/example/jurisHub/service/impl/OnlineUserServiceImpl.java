package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.chat.OnlineUsersResponse;
import com.example.jurisHub.dto.chat.UserOnlineStatus;
import com.example.jurisHub.service.OnlineUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OnlineUserServiceImpl implements OnlineUserService {

    private final Map<String, UserOnlineStatus> onlineUsers = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    public OnlineUserServiceImpl(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void addUser(String userId, String userName, String email, String userType, String sessionId, String avatar) {
        UserOnlineStatus userStatus = UserOnlineStatus.builder()
                .userId(userId)
                .userName(userName)
                .email(email)
                .userType(userType)
                .avatar(avatar)
                .online(true)
                .lastSeen(LocalDateTime.now())
                .sessionId(sessionId)
                .build();
        onlineUsers.put(userId, userStatus);
        log.info("User {} ({}) joined - Session: {}", userName, userType, sessionId);
        broadcastOnlineUsers();
    }

    @Override
    public void removeUser(String userId) {
        UserOnlineStatus removedUser = onlineUsers.remove(userId);
        if (removedUser != null) {
            log.info("User {} ({}) left - Session: {}",
                    removedUser.getUserName(), removedUser.getUserType(), removedUser.getSessionId());
            broadcastOnlineUsers();
        }
    }

    @Override
    public void removeUserBySessionId(String sessionId) {
        Optional<Map.Entry<String, UserOnlineStatus>> userEntry = onlineUsers.entrySet().stream()
                .filter(entry -> sessionId.equals(entry.getValue().getSessionId()))
                .findFirst();

        if (userEntry.isPresent()) {
            String userId = userEntry.get().getKey();
            removeUser(userId);
        }
    }

    @Override
    public void updateLastSeen(String userId) {
        UserOnlineStatus user = onlineUsers.get(userId);
        if (user != null) {
            user.setLastSeen(LocalDateTime.now());
        }
    }

    @Override
    public OnlineUsersResponse getOnlineUsers() {
        List<UserOnlineStatus> users = onlineUsers.values().stream()
                .filter(user -> "USER".equals(user.getUserType()))
                .collect(Collectors.toList());

        List<UserOnlineStatus> lawyers = onlineUsers.values().stream()
                .filter(user -> "LAWYER".equals(user.getUserType()))
                .collect(Collectors.toList());

        return OnlineUsersResponse.builder()
                .users(users)
                .lawyers(lawyers)
                .totalOnline(onlineUsers.size())
                .build();
    }

    private void broadcastOnlineUsers() {
        OnlineUsersResponse response = getOnlineUsers();
        messagingTemplate.convertAndSend("/topic/online-users", response);
    }
}