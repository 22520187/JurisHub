package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.forum.PostLabelDto;
import com.example.jurisHub.entity.PostLabel;
import org.springframework.stereotype.Component;

@Component
public class PostLabelMapper {
    public PostLabelDto toDto(PostLabel label) {
        if (label == null) {
            return null;
        }

        return PostLabelDto.builder()
                .id(label.getId())
                .name(label.getName())
                .slug(label.getSlug())
                .description(label.getDescription())
                .color(label.getColor())
                .isActive(label.getIsActive())
                .categoryId(label.getCategory() != null ? label.getCategory().getId() : null)
                .createdAt(label.getCreatedAt())
                .updatedAt(label.getUpdatedAt())
                .build();
    }

    public PostLabel toEntity(PostLabelDto dto) {
        if (dto == null) {
            return null;
        }

        return PostLabel.builder()
                .id(dto.getId())
                .name(dto.getName())
                .slug(dto.getSlug())
                .description(dto.getDescription())
                .color(dto.getColor())
                .isActive(dto.getIsActive())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
