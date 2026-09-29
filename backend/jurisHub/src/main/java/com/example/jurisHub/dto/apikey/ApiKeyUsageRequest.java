package com.example.jurisHub.dto.apikey;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyUsageRequest {
    private String type; // "pdf" or "chat"
}
