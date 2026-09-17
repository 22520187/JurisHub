package com.example.jurisHub.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBasicDto {
    private Long id;
    private String name;
    private String email;
    private String avatar;
    private String role;
}
