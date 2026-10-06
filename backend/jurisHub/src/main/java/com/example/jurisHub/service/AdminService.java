package com.example.jurisHub.service;

import com.example.jurisHub.dto.admin.LawyerApplicationDto;

import java.util.List;

public interface AdminService {
    List<LawyerApplicationDto> getAllApplications();
    LawyerApplicationDto getApplicationById(Long applicationId);
    LawyerApplicationDto approveApplication(Long applicationId);
    LawyerApplicationDto rejectApplication(Long applicationId);
    LawyerApplicationDto reviewApplication(Long applicationId);
    LawyerApplicationDto assignApplicationToModerator(Long applicationId, Long moderatorId);
}
