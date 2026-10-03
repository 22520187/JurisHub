package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.forum.PostLabelDto;
import com.example.jurisHub.entity.PostCategory;
import com.example.jurisHub.entity.PostLabel;
import com.example.jurisHub.mapper.PostLabelMapper;
import com.example.jurisHub.repository.PostCategoryRepository;
import com.example.jurisHub.repository.PostLabelRepository;
import com.example.jurisHub.service.PostLabelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostLabelServiceImpl implements PostLabelService {
    private final PostLabelRepository postLabelRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final PostLabelMapper postLabelMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PostLabelDto> getAllLabels() {
        return postLabelRepository.findAll()
                .stream()
                .map(postLabelMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostLabelDto> getActiveLabels() {
        return postLabelRepository.findByIsActiveTrue()
                .stream()
                .map(postLabelMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostLabelDto> getLabelsByCategory(Long categoryId) {
        return postLabelRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                .stream()
                .map(postLabelMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostLabelDto> getGlobalLabels() {
        return postLabelRepository.findByCategoryIdIsNullAndIsActiveTrue()
                .stream()
                .map(postLabelMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PostLabelDto getLabelById(Long id) {
        PostLabel label = postLabelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + id));
        return postLabelMapper.toDto(label);
    }

    @Override
    @Transactional(readOnly = true)
    public PostLabelDto getLabelBySlug(String slug) {
        PostLabel label = postLabelRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Label not found with slug: " + slug));
        return postLabelMapper.toDto(label);
    }

    @Override
    @Transactional
    public PostLabelDto createLabel(PostLabelDto labelDto) {
        if (postLabelRepository.existsBySlug(labelDto.getSlug())) {
            throw new RuntimeException("Label with slug already exists: " + labelDto.getSlug());
        }

        PostLabel label = postLabelMapper.toEntity(labelDto);
        label.setIsActive(true);

        if (labelDto.getCategoryId() != null) {
            PostCategory category = postCategoryRepository.findById(labelDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + labelDto.getCategoryId()));
            label.setCategory(category);
        }

        PostLabel savedLabel = postLabelRepository.save(label);
        return postLabelMapper.toDto(savedLabel);
    }

    @Override
    @Transactional
    public PostLabelDto updateLabel(Long id, PostLabelDto labelDto) {
        PostLabel existingLabel = postLabelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + id));

        if (!existingLabel.getSlug().equals(labelDto.getSlug()) &&
                postLabelRepository.existsBySlug(labelDto.getSlug())) {
            throw new RuntimeException("Label with slug already exists: " + labelDto.getSlug());
        }

        existingLabel.setName(labelDto.getName());
        existingLabel.setSlug(labelDto.getSlug());
        existingLabel.setDescription(labelDto.getDescription());
        existingLabel.setColor(labelDto.getColor());
        existingLabel.setIsActive(labelDto.getIsActive());

        if (labelDto.getCategoryId() != null) {
            PostCategory category = postCategoryRepository.findById(labelDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + labelDto.getCategoryId()));
            existingLabel.setCategory(category);
        } else {
            existingLabel.setCategory(null); // Make it global
        }

        PostLabel updatedLabel = postLabelRepository.save(existingLabel);
        return postLabelMapper.toDto(updatedLabel);
    }

    @Override
    @Transactional
    public void deleteLabel(Long id) {
        if (!postLabelRepository.existsById(id)) {
            throw new RuntimeException("Label not found with id: " + id);
        }
        postLabelRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void toggleLabelStatus(Long id) {
        PostLabel label = postLabelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + id));
        label.setIsActive(!label.getIsActive());
        postLabelRepository.save(label);
    }
}
