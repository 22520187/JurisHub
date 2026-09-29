package com.example.jurisHub.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface CloudinaryService {

    String uploadFile(MultipartFile file, String folder);

    String[] uploadFiles(MultipartFile[] files, String folder);

    boolean deleteFile(String publicId);

    String extractPublicId(String cloudinaryUrl);
}
