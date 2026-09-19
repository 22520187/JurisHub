package com.example.jurisHub.service;

import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.dto.forum.PostCreateDto;
import com.example.jurisHub.dto.forum.PostDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;


public interface ForumService {
    List<PostCategoryDto> getAllCategories();
    PostCategoryDto getCategoryBySlug(String slug);

    Page<PostDto> getAllPosts(Pageable pageable);
    Page<PostDto> getAllPosts(Pageable pageable, Long categoryId, String timeFilter);
    Page<PostDto> getPostsByCategory(String categorySlug, Pageable pageable);
    Page<PostDto> searchPosts(String keyword, Pageable pageable);
    Page<PostDto> searchPostsByCategory(String keyword, String categorySlug, Pageable pageable);
    PostDto getPostById(Long postId, Long currentUserId);
    PostDto getPostBySlug(String categorySlug, String postSlug, Long currentUserId);
    void incrementPostViews(String categorySlug, String postSlug);
    PostDto createPost(PostCreateDto postCreateDto, Long authorId);
    PostDto updatePost(Long id, PostCreateDto postUpdateDto, Long authorId);
    void deletePost(Long id, Long authorId);
}
