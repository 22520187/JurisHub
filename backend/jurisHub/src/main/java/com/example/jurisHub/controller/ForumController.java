package com.example.jurisHub.controller;

import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.dto.forum.PostDto;
import com.example.jurisHub.service.ForumService;
import com.example.jurisHub.service.VotingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = {"http://localhost:3000"})
public class ForumController {
    private final ForumService postService;
//    private final VotingService votingService;

    @GetMapping("/categories")
    public ResponseEntity<List<PostCategoryDto>> getAllCategories() {
        List<PostCategoryDto> categories = postService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/categories/{slug}")
    public ResponseEntity<PostCategoryDto> getCategoriesBySlug(@PathVariable String slug) {
        PostCategoryDto categories = postService.getCategoryBySlug(slug);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/posts")
    public ResponseEntity<Page<PostDto>> getAllPosts(Pageable pageable,
                                                     @RequestParam(required = false) Long categoryId,
                                                    @RequestParam(required = false) String timeFilter) {
        System.out.println("getAllPosts - Pageable: " + pageable);
        System.out.println("getAllPosts - CategoryId: " + categoryId);
        System.out.println("getAllPosts - TimeFilter: " + timeFilter);
        Page<PostDto> posts = postService.getAllPosts(pageable, categoryId, timeFilter);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/categories/{categorySlug}/posts")
    public ResponseEntity<Page<PostDto>> getPostsByCategory(
            @PathVariable String categorySlug,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<PostDto> posts = postService.getPostsByCategory(categorySlug, pageable);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/posts/search")
    public ResponseEntity<Page<PostDto>> searchPosts(
            @RequestParam String keyword,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<PostDto> posts = postService.searchPosts(keyword, pageable);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/categories/{categorySlug}/posts/search")
    public ResponseEntity<Page<PostDto>> searchPostsByCategory(
            @RequestParam String keyword,
            @PathVariable String categorySlug,

            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<PostDto> posts = postService.searchPostsByCategory(keyword, categorySlug, pageable);
        return ResponseEntity.ok(posts);
    }

}
