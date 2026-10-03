package com.example.jurisHub.service;

import com.example.jurisHub.dto.forum.PostLabelDto;

import java.util.List;

public interface PostLabelService {

    List<PostLabelDto> getAllLabels();

    List<PostLabelDto> getActiveLabels();

    List<PostLabelDto> getLabelsByCategory(Long categoryId);

    List<PostLabelDto> getGlobalLabels();

    PostLabelDto getLabelById(Long id);

    PostLabelDto getLabelBySlug(String slug);

    PostLabelDto createLabel(PostLabelDto labelDto);

    PostLabelDto updateLabel(Long id, PostLabelDto labelDto);

    void deleteLabel(Long id);

    void toggleLabelStatus(Long id);

}
