package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PdfDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PdfDocumentRepository extends JpaRepository<PdfDocument, Long> {
    /**
     * Find PDF document by conversation ID
     */
    Optional<PdfDocument> findByConversationId(Long conversationId);

    /**
     * Delete PDF document by conversation ID
     */
    void deleteByConversationId(Long conversationId);

}
