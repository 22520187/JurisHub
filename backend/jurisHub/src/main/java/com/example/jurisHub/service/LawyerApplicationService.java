package com.example.jurisHub.service;

import com.example.jurisHub.dto.admin.LawyerApplicationDto;
import com.example.jurisHub.dto.lawyer.LawyerApplicationRequest;

import java.util.List;
import java.util.Optional;

public interface LawyerApplicationService {

    LawyerApplicationDto submitApplication(LawyerApplicationRequest request);

    Optional<LawyerApplicationDto> getUserApplication();

    boolean hasUserApplied();

    boolean canUserApply();

    LawyerApplicationDto updateApplicationDocuments(Long applicationId, List<String> newDocumentUrls);

    void deleteApplication(Long applicationId);

}
