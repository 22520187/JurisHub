package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.forum.PostDto;
import com.example.jurisHub.entity.Post;
import com.example.jurisHub.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PostMapper {
    @Autowired
    private PostCategoryMapper categoryMapper;

   @Autowired
    private UserMapper userMapper;

    @Autowired
    private PostLabelMapper labelMapper;

    public PostDto toDto(Post post) {
        if (post == null) {
            return null;
        }

        PostDto.PostDtoBuilder builder = PostDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .slug(post.getSlug())
                .content(post.getContent())
                .view(post.getViews())
                .replyCount(post.getReplyCount())
                .upvoteCount(post.getUpvoteCount() != null ? post.getUpvoteCount() : 0)
                .downvoteCount(post.getDownvoteCount() != null ? post.getDownvoteCount() : 0)
                .userVote(null) // Will be set by controller if user is authenticated
                .pinned(post.getPinned())
                .solved(post.getSolved())
                .isHot(post.getIsHot())
                .tags(post.getTagsSet())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .lastReplyAt(post.getLastReplyAt());
        if (post.getCategory() != null) {
            builder.category(categoryMapper.toDto(post.getCategory()));
        }
        if (post.getAuthor() != null) {
            builder.author(toUserSummaryDto(post.getAuthor()));
        }

        if (post.getLabels() != null && !post.getLabels().isEmpty()) {
            builder.labels(post.getLabels().stream()
                    .map(labelMapper::toDto)
                    .collect(java.util.stream.Collectors.toList()));
        }

        if (post.getLastReplyAt() != null) {
            PostDto.LastReplyDto lastReply = PostDto.LastReplyDto.builder()
                    .date(post.getLastReplyAt())
                    .build();
            builder.lastReply(lastReply);
        }

        return builder.build();
    }

    /**
     * Convert PostCreateDto to Post entity
     */
//    public Post toEntity(PostCreateDto createDto, PostCategory category, User author) {
//        if (createDto == null) {
//            return null;
//        }
//
//        Post post = new Post();
//        post.setTitle(createDto.getTitle());
//        post.setContent(createDto.getContent());
//        post.setCategory(category);
//        post.setAuthor(author);
//        post.setPinned(createDto.getPinned() != null ? createDto.getPinned() : false);
//        post.setIsHot(createDto.getIsHot() != null ? createDto.getIsHot() : false);
//        post.setSolved(false);
//        post.setIsActive(true);
//        post.setViews(0);
//        post.setReplyCount(0);
//
//        if (createDto.getTags() != null) {
//            post.setTagsFromSet(createDto.getTags());
//        }
//
//        return post;
//    }

    /**
     * Update existing Post entity from PostCreateDto
     */
//    public void updateEntity(Post existingPost, PostCreateDto updateDto, PostCategory category) {
//        if (existingPost == null || updateDto == null) {
//            return;
//        }
//
//        existingPost.setTitle(updateDto.getTitle());
//        existingPost.setContent(updateDto.getContent());
//
//        if (category != null) {
//            existingPost.setCategory(category);
//        }
//
//        if (updateDto.getPinned() != null) {
//            existingPost.setPinned(updateDto.getPinned());
//        }
//
//        if (updateDto.getIsHot() != null) {
//            existingPost.setIsHot(updateDto.getIsHot());
//        }
//
//        if (updateDto.getTags() != null) {
//            existingPost.setTagsFromSet(updateDto.getTags());
//        }
//    }

    /**
     * Convert User to UserSummaryDto
     */
    public PostDto.UserSummaryDto toUserSummaryDto(User user) {
        if (user == null) {
            return null;
        }

        return PostDto.UserSummaryDto.builder()
                .id(user.getId())
                .name(getAuthorName(user))
                .email(user.getEmail())
                .role(getAuthorRole(user))
                .avatar(user.getAvatar())
                .build();
    }

    /**
     * Helper method to get author name
     */
    private String getAuthorName(User user) {
        return userMapper.getDisplayName(user);
    }

    /**
     * Helper method to get author role
     */
    private String getAuthorRole(User user) {
        return userMapper.getRoleString(user);
    }
}
