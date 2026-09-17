package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.dto.forum.PostDto;
import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.PostCategory;
import com.example.jurisHub.entity.User;
import com.example.jurisHub.mapper.PostCategoryMapper;
import com.example.jurisHub.mapper.PostMapper;
import com.example.jurisHub.repository.ForumRepository;
import com.example.jurisHub.repository.PostCategoryRepository;
import com.example.jurisHub.repository.PostReplyRepository;
import com.example.jurisHub.service.ForumService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.Cache;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ForumServiceImpl implements ForumService {

//    private final RabbitTemplate rabbitTemplate;
    private final ForumRepository postRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final PostReplyRepository postReplyRepository;
    private final PostCategoryMapper categoryMapper;
    private final PostMapper postMapper;

    @Override
    @Transactional(readOnly = true)
    public List<PostCategoryDto> getAllCategories() {
        log.info("Fetching all categories from database (cache disabled)...");

        List<PostCategory> categories = postCategoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        List<Post> latestPosts = postRepository.findLatestPostByCategory();

        latestPosts.forEach(post -> {
            if (post.getAuthor() != null) {
                post.getAuthor().getEmail(); // Force loading of author email
            }
            if (post.getCategory() != null) {
                post.getCategory().getName(); // Force loading of category name
            }
        });

        Map<Long, Post> latestPostMap = latestPosts.stream()
                .collect(java.util.stream.Collectors.toMap(
                        post -> post.getCategory().getId(),
                        post -> post)
                );

        List<PostCategoryDto> result = categories.stream()
                .map(category -> {
                    PostCategoryDto dto = categoryMapper.toDto(category);
                    Post latestPost = latestPostMap.get(category.getId());
                    if (latestPost != null && latestPost.getAuthor() !=null) {
                        PostCategoryDto.PostSummaryDto lastPost = PostCategoryDto.PostSummaryDto.builder()
                                .id(latestPost.getId())
                                .title(latestPost.getTitle())
                                .slug(latestPost.getSlug())
                                .authorName(getDisplayName(latestPost.getAuthor()))
                                .authorRole(getRoleString(latestPost.getAuthor()))
                                .authorAvatar(latestPost.getAuthor().getAvatar())
                                .views(latestPost.getViews() != null ? latestPost.getViews() : 0)
                                .createdAt(latestPost.getCreatedAt())
                                .build();
                        dto.setLastPost(lastPost);
                    }

                    long threadsCount = postRepository.countByCategoryIdAndIsActiveTrue(category.getId());
                    dto.setThreadCount((int) threadsCount);

                    long repliesCount = postReplyRepository.countByCategoryId(category.getId());
                    dto.setPostCount((int) (threadsCount + repliesCount));

                    return dto;
                })
                .collect(Collectors.toList());

        return result;
    }

    private String getDisplayName(User user) {
        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            return user.getFullName();
        }
        return user.getEmail(); // Use email as fallback instead of username
    }

    private String getRoleString(User user) {
        if (user.getRole() != null) {
            return user.getRole().name();
        }
        return "USER";
    }

    @Override
    public PostCategoryDto getCategoryBySlug(String slug) {
        PostCategory category = postCategoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found with slug: " + slug));
        return categoryMapper.toDto(category);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostDto> getAllPosts(Pageable pageable) {
        return postRepository.findAllWithCategoryAndAuthor(pageable)
                .map(postMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostDto> getAllPosts(Pageable pageable, Long categoryId, String timeFilter) {
        if (categoryId != null) {
            return postRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable)
                    .map(postMapper::toDto);
        }

        if (timeFilter != null && !timeFilter.equals("all")) {
            LocalDateTime startDate = null;
            LocalDateTime now = LocalDateTime.now();

            switch (timeFilter) {
                case "today":
                    startDate = now.toLocalDate().atStartOfDay();
                    break;
                case "week":
                    startDate = now.minusWeeks(1);
                    break;
                case "month":
                    startDate = now.minusMonths(1);
                    break;
                case "year":
                    startDate = now.minusYears(1);
                    break;
            }

            if (startDate != null) {
                return postRepository.findByIsActiveTrueAndCreatedAtAfter(startDate, pageable)
                        .map(postMapper::toDto);
            }
        }

        return getAllPosts(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostDto> getPostsByCategory(String categorySlug, Pageable pageable) {
        return postRepository.findByCategorySlugAndIsActiveTrue(categorySlug, pageable)
                .map(postMapper::toDto);
    }

    @Override
    @Cacheable(value = "search_posts", key = "#keyword + ':' + #pageable.pageNumber + ':' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public Page<PostDto> searchPosts(String keyword, Pageable pageable) {
        Page<Post> titleResults = postRepository.findByIsActiveTrueAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(keyword, pageable);
        if (titleResults.hasContent()) {
            return titleResults.map(postMapper::toDto);
        }
        Sort sort = Sort.by(Sort.Direction.DESC, "created_at");
        Pageable contentPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<Post>contentResults = postRepository.findByIsActiveTrueAndContentContaining("%" + keyword + "%", contentPageable);

        return contentResults.map(postMapper::toDto);
    }

    @Override
    @Cacheable(value = "search_posts_by_category", key = "#keyword + ':' + #categorySlug + ':' + #pageable.pageNumber + ':' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public Page<PostDto> searchPostsByCategory(String keyword, String categorySlug, Pageable pageable) {
        return postRepository.findByCategorySlugAndIsActiveTrue(categorySlug, pageable)
                .map(postMapper::toDto);
    }

}
