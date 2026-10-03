package com.example.jurisHub.service;

import com.example.jurisHub.dto.chat.OnlineUsersResponse;

public interface OnlineUserService {
    void addUser(String userId, String userName, String email, String userType, String sessionId, String avatar);
    void removeUser(String userId);
    void removeUserBySessionId(String sessionId);
    void updateLastSeen(String userId);
    OnlineUsersResponse getOnlineUsers();
}
