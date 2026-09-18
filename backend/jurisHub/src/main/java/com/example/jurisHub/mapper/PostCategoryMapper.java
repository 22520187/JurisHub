package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.entity.PostCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PostCategoryMapper {
    private final PostLabelMapper postLabelMapper;

    /**
     * Convert PostCategory entity to PostCategoryDto
     */
    public PostCategoryDto toDto(PostCategory category) {
        if (category == null) {
            return null;
        }

        PostCategoryDto.PostCategoryDtoBuilder builder = PostCategoryDto.builder()
                .id(category.getId())
                .slug(category.getSlug())
                .name(category.getName())
                .description(category.getDescription())
                .icon(category.getIcon())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt());

        if (category.getLabels() != null && !category.getLabels().isEmpty()) {
            builder.labels(category.getLabels().stream()
                    .map(postLabelMapper::toDto)
                    .collect(Collectors.toList()));
        }

        builder.threadCount(0).postCount(0);

        return builder.build();
    }
}
