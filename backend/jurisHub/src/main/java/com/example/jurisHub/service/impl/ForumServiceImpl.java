package com.example.jurisHub.service.impl;

import com.example.jurisHub.config.RabbitMQConfig;
import com.example.jurisHub.dto.forum.PostCategoryDto;
import com.example.jurisHub.dto.forum.PostCreateDto;
import com.example.jurisHub.dto.forum.PostDto;
import com.example.jurisHub.dto.forum.PostReplyDto;
import com.example.jurisHub.dto.messaging.SentimentAnalysisMessage;
import com.example.jurisHub.entity.*;
import com.example.jurisHub.mapper.PostCategoryMapper;
import com.example.jurisHub.mapper.PostMapper;
import com.example.jurisHub.repository.*;
import com.example.jurisHub.service.ForumService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.annotations.Cache;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ForumServiceImpl implements ForumService {

    private final RabbitTemplate rabbitTemplate;
    private final ForumRepository postRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final PostReplyRepository postReplyRepository;
    private final PostVoteRepository postVoteRepository;
    private final ReplyVoteRepository replyVoteRepository;
    private final PostLabelRepository postLabelRepository;
    private final PostCategoryMapper categoryMapper;
    private final PostMapper postMapper;
    private final UserRepository userRepository;

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

    @Override
    @Transactional(readOnly = true)
    public PostDto getPostById(Long postId, Long currentUserId) {
        Post post = postRepository.findByIdWithCategoryAndAuthorIncludingInactive(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with ID: " + postId));

        if (!post.getIsActive()) {
            boolean isAuthor = currentUserId != null && post.getAuthor().getId().equals(currentUserId);
            boolean isAdmin =false;
            if (currentUserId != null) {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                isAdmin =currentUser != null && currentUser.getRole() == User.Role.ADMIN;
            }

            if (!isAuthor && !isAdmin) {
                throw new RuntimeException("Post not found");
            }
        }

        post.incrementViews();
        postRepository.save(post);

        PostDto dto =postMapper.toDto(post);
        enrichWithUserVote(dto, currentUserId);
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public PostDto getPostBySlug(String categorySlug, String postSlug, Long currentUserId) {
        Post post = postRepository.findByCategorySlugAndPostSlug(categorySlug, postSlug)
                .orElseThrow(() -> new RuntimeException("Post not found with slug: " + postSlug + " in category: " + categorySlug));
        PostDto dto = postMapper.toDto(post);
        enrichWithUserVote(dto, currentUserId);
        return dto;
    }

    @Transactional
    public void incrementPostViews(String categorySlug, String postSlug) {
        Post post = postRepository.findByCategorySlugAndPostSlug(categorySlug, postSlug)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.incrementViews();
        postRepository.save(post);
    }

    private void enrichWithUserVote(PostDto dto, Long userId) {
        System.out.println("Enriching post " + dto.getId() + " with user vote. UserId: " + userId);
        if (userId != null) {
            Optional<PostVote> vote = postVoteRepository.findByPostIdAndUserId(dto.getId(), userId);
            System.out.println("Vote found: " + vote.isPresent());
            if (vote.isPresent()) {
                String voteType = vote.get().getVoteType().name();
                System.out.println("Setting userVote to: " + voteType);
                dto.setUserVote(voteType);
            }

            if (dto.getReplies() != null) {
                for (PostReplyDto reply : dto.getReplies()) {
                    enrichReplyWithUserVote(reply, userId);
                }
            }
        }
    }

    private void enrichReplyWithUserVote(PostReplyDto dto, Long userId) {
        if (userId != null && dto != null) {
            Optional<ReplyVote> vote = replyVoteRepository.findByReplyIdAndUserId(dto.getId(), userId);
            if (vote.isPresent()) {
                dto.setUserVote(vote.get().getVoteType().name());
            }

            if (dto.getChildren() != null) {
                for (PostReplyDto child : dto.getChildren()) {
                    enrichReplyWithUserVote(child, userId);
                }
            }
        }
    }

    @Override
    @CacheEvict(value = {"categories", "forumStats", "popularTopics", "categoryStats", "popularTags"}, allEntries = true)
    public PostDto createPost(PostCreateDto postCreateDto, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        PostCategory category = postCategoryRepository.findById(postCreateDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Post post = postMapper.toEntity(postCreateDto, category, author);

        if (postCreateDto.getLabelIds() != null && !postCreateDto.getLabelIds().isEmpty()) {
            List<PostLabel> labels = postLabelRepository.findAllById(postCreateDto.getLabelIds());
            if (labels.size() != postCreateDto.getLabelIds().size()) {
                throw new RuntimeException("One or more label not found");
            }
            post.setLabels(new HashSet<>(labels));
        }

        post = postRepository.save(post);

        try {
            SentimentAnalysisMessage message = SentimentAnalysisMessage.builder()
                    .entityId(post.getId())
                    .entityType("POST")
                    .content(post.getContent())
                    .title(post.getTitle())
                    .authorId(authorId)
                    .build();
            rabbitTemplate.convertAndSend(RabbitMQConfig.SENTIMENT_EXCHANGE, RabbitMQConfig.SENTIMENT_ROUTING_KEY, message);
            log.info("Sent post {} for async sentiment analysis", post.getId());
        } catch (Exception e) {
            log.error("Failed to send post for sentiment analysis: {}", e.getMessage());
        }

        return postMapper.toDto(post);
    }

    @Override
    @CacheEvict(value = {"categories", "forumStats", "popularTopics", "categoryStats", "popularTags"}, allEntries = true)
    public PostDto updatePost(Long id, PostCreateDto postUpdateDto, Long authorId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Unauthorized");
        }

        PostCategory category = null;
        if (postUpdateDto.getCategoryId() != null) {
            category = postCategoryRepository.findById(postUpdateDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        postMapper.updateEntity(post, postUpdateDto, category);

        if (postUpdateDto.getLabelIds() != null) {
            if (postUpdateDto.getLabelIds().isEmpty()) {
                post.getLabels().clear();
            } else {
                List<PostLabel> labels = postLabelRepository.findAllById(postUpdateDto.getLabelIds());
                if (labels.size() != postUpdateDto.getLabelIds().size()) {
                    throw new RuntimeException("One or more labels not found");
                }
                post.setLabels(new HashSet<>(labels));
            }
        }

        post =postRepository.save(post);
        return postMapper.toDto(post);
    }

    @Override
    @CacheEvict(value = {"categories", "forumStats", "popularTopics", "categoryStats", "popularTags"}, allEntries = true)
    public void deletePost(Long id, Long authorId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Unauthorized");
        }

        post.setIsActive(false);
        postRepository.save(post);
    }

}
