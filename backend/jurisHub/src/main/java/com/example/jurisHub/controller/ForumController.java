package com.example.jurisHub.controller;

import com.example.jurisHub.dto.forum.*;
import com.example.jurisHub.security.UserPrincipal;
import com.example.jurisHub.service.ForumService;
import com.example.jurisHub.service.VotingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@Validated
@CrossOrigin(origins = {"http://localhost:3000"})
public class ForumController {
    private final ForumService postService;
    private final VotingService votingService;

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

    @GetMapping("/post/{id}")
    public ResponseEntity<PostDto> getPostById(@PathVariable Long id, Authentication authentication) {
        Long currentUserId = getUserIdFromAuth(authentication);
        System.out.println("getPostById - id: " + id + " currentUserId: " + currentUserId);
        PostDto post = postService.getPostById(id, currentUserId);
        return ResponseEntity.ok(post);
    }

    /**
     * Get post by category slug and post slug (SEO-friendly URL)
     */
    @GetMapping("/categories/{categorySlug}/posts/{postsSlug}")
    public ResponseEntity<PostDto> getPostBySlug(@PathVariable String categorySlug, @PathVariable String postSlug, Authentication authentication) {
        Long currentUserId = getUserIdFromAuth(authentication);
        System.out.println("getPostBySlug - Category: " + categorySlug + ", Slug: " + postSlug + ", CurrentUserId: " + currentUserId);
        PostDto post = postService.getPostBySlug(categorySlug, postSlug, currentUserId);
        return ResponseEntity.ok(post);
    }

    @PostMapping("/categories/{categorySlug}/posts/{postSlug}/increment-views")
    public ResponseEntity<Map<String, String>> incrementPostViews(@PathVariable String categorySlug,
                                                                  @PathVariable String postSlug) {
        log.info("Incrementing views for post: {}/{}", categorySlug, postSlug);
        postService.incrementPostViews(categorySlug, postSlug);
        log.info("Views incremented successfully for post: {}/{}", categorySlug, postSlug);
        return ResponseEntity.ok(Map.of("message", "Views incremented successfully"));
    }

    /**
     * Create new post
     */
    @PostMapping("/posts")
    public ResponseEntity<PostDto>createPost(@Valid @RequestBody PostCreateDto postCreateDto, Authentication authentication) {
        Long authorId = getUserIdFromAuthentication(authentication);
        PostDto createPost = postService.createPost(postCreateDto, authorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createPost);
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<PostDto> updatePost(@PathVariable Long id,
                                              @Valid @RequestBody PostCreateDto postCreateDto,
                                              Authentication authentication) {
        Long authorId = getUserIdFromAuthentication(authentication);
        PostDto updatePost = postService.updatePost(id, postCreateDto, authorId);
        return ResponseEntity.ok(updatePost);
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<PostDto> deletePost(@PathVariable Long id, Authentication authentication) {
        Long authorId = getUserIdFromAuthentication(authentication);
        postService.deletePost(id, authorId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/posts/{postId}/replies")
    public ResponseEntity<List<PostReplyDto>> getRepliesByPost(@PathVariable Long postId, Authentication authentication) {
        Long currentUserId = getUserIdFromAuth(authentication);
        System.out.println("==========================================");
        System.out.println("getRepliesByPost - PostId: " + postId + ", CurrentUserId: " + currentUserId);
        System.out.println("Authentication object: " + authentication);
        List<PostReplyDto> replies = postService.getReplyByPost(postId, currentUserId);
        for (PostReplyDto reply : replies) {
            System.out.println("  Reply ID: " + reply.getId() +
                    ", upvote: " + reply.getUpvoteCount() +
                    ", downvote: " + reply.getDownvoteCount() +
                    ", userVote: " + reply.getUserVote());
        }
        System.out.println("==========================================");
        return ResponseEntity.ok(replies);
    }

    @PostMapping("/posts/{postId}/replies")
    public ResponseEntity<PostReplyDto> addReply(@PathVariable Long postId,
                                                 @Valid @RequestBody AddReplyDto addReplyDto,
                                                 Authentication authentication) {
        Long authorId = getUserIdFromAuthentication(authentication);
        PostReplyDto reply = postService.addReply(postId, addReplyDto.getContent(), authorId, addReplyDto.getParentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(reply);
    }

    /**
     * Delete reply
     */
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(
            @PathVariable Long replyId,
            Authentication authentication) {
        Long authorId = getUserIdFromAuthentication(authentication);
        postService.deleteReply(replyId, authorId);
        return ResponseEntity.noContent().build();
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                UserPrincipal userPrincipal = (UserPrincipal) principal;
                return userPrincipal.getId();
            }
        }
        throw new RuntimeException("User not authenticated");
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        try {
            if (authentication !=null && authentication.isAuthenticated()) {
                Object principal = authentication.getPrincipal();

                if (principal instanceof UserPrincipal) {
                    UserPrincipal userPrincipal = (UserPrincipal) principal;
                    return userPrincipal.getId();
                }
            }
        } catch (Exception e) {
            System.out.println("Error getting user ID: " + e.getMessage());
        }
        return null; // Allow null for unauthenticated users
    }

    @GetMapping("/stats")
    public ResponseEntity<ForumStatsDto> getForumStats() {
        ForumStatsDto stats = postService.getForumStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/popular-topics")
    public ResponseEntity<List<PopularTopicDto>> getPopularTopics(@RequestParam(defaultValue = "5") int limit) {
        List<PopularTopicDto> topics = postService.getPopularTopics(limit);
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/category-stats")
    public ResponseEntity<List<CategoryStatsDto>> getCategoryStats() {
        List<CategoryStatsDto> stats = postService.getCategoryStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/popular-tags")
    public ResponseEntity<List<PopularTagDto>> getPopularTags(
            @RequestParam(defaultValue = "10") int limit) {
        List<PopularTagDto> tags = postService.getPopularTags(limit);
        return ResponseEntity.ok(tags);
    }

    /**
     * Vote on a post
     */
    @PostMapping("/posts/{postId}/vote")
    public ResponseEntity<VoteDto> votePost(
            @PathVariable Long postId,
            @Valid @RequestBody VoteRequestDto voteRequest,
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        VoteDto voteDto = votingService.votePost(postId, userId, voteRequest.getVoteType());
        return ResponseEntity.ok(voteDto);
    }

    /**
     * Vote on a reply
     */
    @PostMapping("/replies/{replyId}/vote")
    public ResponseEntity<VoteDto> voteReply(
            @PathVariable Long replyId,
            @Valid @RequestBody VoteRequestDto voteRequest,
            Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        VoteDto voteDto = votingService.voteReply(replyId, userId, voteRequest.getVoteType());
        return ResponseEntity.ok(voteDto);
    }

}
