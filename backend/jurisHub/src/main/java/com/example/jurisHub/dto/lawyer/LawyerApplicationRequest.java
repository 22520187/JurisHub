package com.example.jurisHub.dto.lawyer;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawyerApplicationRequest {
    @NotBlank(message = "License number is required")
    @Size(max = 50, message = "License number cannot exceed 50 characters")
    private String licenseNumber;

    @NotBlank(message = "Law school is required")
    @Size(max = 200, message = "Law school name cannot exceed 200 characters")
    private String lawSchool;

    @NotNull(message = "Graduation year is required")
    @Min(value = 1950, message = "Graduation year must be after 1950")
    @Max(value = 2025, message = "Graduation year cannot be in the future")
    private Integer graduationYear;

    @NotEmpty(message = "At least one specialization is required")
    private List<String> specializations;

    @NotNull(message = "Years of experience is required")
    @Min(value = 0, message = "Years of experience cannot be negative")
    @Max(value = 50, message = "Years of experience cannot exceed 50")
    private Integer yearsOfExperience;

    @Size(max = 200, message = "Current firm name cannot exceed 200 characters")
    private String currentFirm;

    @NotBlank(message = "Bio is required")
    @Size(max = 2000, message = "Bio cannot exceed 2000 characters")
    private String bio;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone number must be 10-11 digits")
    private String phoneNumber;

    @Size(max = 500, message = "Office address cannot exceed 500 characters")
    private String officeAddress;

    @NotEmpty(message = "At least one document is required")
    private List<String> documentUrls;
}
