package com.example.jurisHub.dto.user;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @Size(max = 2000, message = "Bio cannot exceed 2000 characters")
    private String bio;

    private List<String> legalExpertise;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Pattern(regexp = "^[+]?[0-9\\s\\-()]*$", message = "Phone number must contain only digits, spaces, hyphens, parentheses, and optional plus sign")
    private String phoneNumber;

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    private String avatar;
}
