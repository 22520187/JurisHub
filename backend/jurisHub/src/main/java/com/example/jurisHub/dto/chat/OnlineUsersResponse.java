package com.example.jurisHub.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineUsersResponse {
    private List<UserOnlineStatus> users;
    private List<UserOnlineStatus> lawyers;
    private int totalOnline;
}
