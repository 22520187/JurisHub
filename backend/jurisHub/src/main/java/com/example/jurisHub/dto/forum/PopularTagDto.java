package com.example.jurisHub.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for popular tags
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopularTagDto {
    
    private String tag;
    private Long count;
}
