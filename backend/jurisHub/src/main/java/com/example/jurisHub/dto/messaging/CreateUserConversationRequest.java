package com.example.jurisHub.dto.messaging;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserConversationRequest {
    @NotNull(message = "User ID is required")
    private Long otherUserId;
}
