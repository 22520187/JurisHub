package com.example.jurisHub.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.jurisHub.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Upload a file to Cloudinary
     * @param file The file to upload
     * @param folder The folder to upload to (e.g., "lawyer-documents", "avatars")
     * @return The URL of the uploaded file
     * @throws IOException if upload fails
     */

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        validateFileType(file);
        String publicId = folder + "/" + UUID.randomUUID().toString();

        try{
            Map<String, Object> uploadParams =  ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", folder,
                    "resource_type", "auto",
                    "overwrite", true,
                    "quality", "auto:good",
                    "fetch_format", "auto"
            );

            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("File uploaded successfully to Cloudinary: {}", secureUrl);

            return secureUrl;

        } catch(Exception e) {
            log.error("Error uploading file to Cloudinary: {}", e.getMessage());
            throw new RuntimeException("Failed to upload file to Cloudinary", e);
        }
    }

    /**
     * Upload multiple files to Cloudinary
     * @param files Array of files to upload
     * @param folder The folder to upload to
     * @return Array of URLs of the uploaded files
     * @throws IOException if any upload fails
     */
    public String[] uploadFiles(MultipartFile[] files, String folder) {
        if (files == null || files.length == 0) {
            throw new IllegalArgumentException("Files array cannot be empty");
        }

        String[] urls = new String[files.length];

        for (int i = 0; i < files.length; i++) {
            urls[i] = uploadFile(files[i], folder);
        }

        return urls;
    }

    /**
     * Delete a file from Cloudinary
     * @param publicId The public ID of the file to delete
     * @return true if deletion was successful
     */
    public boolean deleteFile(String publicId) {
        try {
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String resultStatus = (String) result.get("result");

            boolean success = "ok".equals(resultStatus);
            log.info("File deletion result for {}: {}", publicId, resultStatus);

            return success;

        } catch (IOException e) {
            log.error("Failed to delete file from Cloudinary: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract public ID from Cloudinary URL
     * @param cloudinaryUrl The full Cloudinary URL
     * @return The public ID
     */
    public String extractPublicId(String cloudinaryUrl) {
        if (cloudinaryUrl == null || !cloudinaryUrl.contains("cloudinary.com")) {
            return null;
        }

        try {
            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            String[] parts = cloudinaryUrl.split("/");
            String fileNameWithExtension = parts[parts.length - 1];

            String publicId = fileNameWithExtension.substring(0, fileNameWithExtension.lastIndexOf('.'));

            if (parts.length > 8) {
                StringBuilder fullPublicId = new StringBuilder();
                for (int i = 8; i < parts.length - 1; i++) {
                    fullPublicId.append(parts[i]).append("/");
                }
                fullPublicId.append(publicId);
                return fullPublicId.toString();
            }

            return publicId;

        } catch (Exception e) {
            log.error("Failed to extract public ID from URL: {}", cloudinaryUrl);
            return null;
        }
    }

    /**
     * Validate file type for uploads
     * @param file The file to validate
     */
    private void validateFileType(MultipartFile file) {
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        if (contentType == null) {
            throw new IllegalArgumentException("File content type cannot be determined");
        }

        if (!isValidFileType(contentType, originalFilename)) {
            throw new IllegalArgumentException(
                    "Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG");
        }

        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException("File size must not exceed 10MB");
        }
    }

    /**
     * Check if file type is valid for upload
     */
    private boolean isValidFileType(String contentType, String filename) {
        return contentType.equals("application/pdf") ||
                contentType.equals("application/msword") ||
                contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png") ||
                (filename != null && (
                        filename.toLowerCase().endsWith(".pdf") ||
                                filename.toLowerCase().endsWith(".doc") ||
                                filename.toLowerCase().endsWith(".docx") ||
                                filename.toLowerCase().endsWith(".jpg") ||
                                filename.toLowerCase().endsWith(".jpeg") ||
                                filename.toLowerCase().endsWith(".png")
                ));
    }

}
