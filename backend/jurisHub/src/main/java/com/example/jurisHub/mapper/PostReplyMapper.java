package com.example.jurisHub.mapper;

import com.example.jurisHub.dto.forum.PostReplyDto;
import com.example.jurisHub.entity.PostReply;
import com.example.jurisHub.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PostReplyMapper {
    private final UserMapper userMapper;

    /**
     * Convert PostReply entity to PostReplyDto
     */
    public PostReplyDto toDto(PostReply reply) {
        if (reply == null) {
            return null;
        }

        List<Long> mentionedUserIds = new ArrayList<>();
        if (reply.getMentionedUserIds() != null && !reply.getMentionedUserIds().trim().isEmpty()) {
            mentionedUserIds = Arrays.stream(reply.getMentionedUserIds().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::parseLong)
                    .collect(Collectors.toList());
        }

        PostReplyDto.PostReplyDtoBuilder builder = PostReplyDto.builder()
                .id(reply.getId())
                .content(reply.getContent())
                .postId(reply.getPost().getId())
                .parentId(reply.getParent() != null ? reply.getParent().getId() : null)
                .upvoteCount(reply.getUpvoteCount() != null ? reply.getUpvoteCount() : 0)
                .downvoteCount(reply.getDownvoteCount() != null ? reply.getDownvoteCount() : 0)
                .userVote(null) // Will be set by controller if user is authenticated
                .mentionedUserIds(mentionedUserIds)
                .isActive(reply.getIsActive())
                .isSolution(reply.getIsSolution())
                .createdAt(reply.getCreatedAt())
                .updatedAt(reply.getUpdatedAt())
                .isTopLevel(reply.isTopLevel())
                .childrenCount(reply.getChildrenCount());

        if (reply.getAuthor() != null) {
            builder.author(toUserSummaryDto(reply.getAuthor()));
        }

        if (reply.getChildren() != null && !reply.getChildren().isEmpty()) {
            List<PostReplyDto> childrenDtos = reply.getChildren().stream()
                    .filter(PostReply::getIsActive)
                    .map(this::toDto)
                    .collect(Collectors.toList());
            builder.children(childrenDtos);
        }

        return builder.build();
    }

    /**
     * Convert User to UserSummaryDto for replies
     */
    public PostReplyDto.UserSummaryDto toUserSummaryDto(User user) {
        if (user == null) {
            return null;
        }

        return PostReplyDto.UserSummaryDto.builder()
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
