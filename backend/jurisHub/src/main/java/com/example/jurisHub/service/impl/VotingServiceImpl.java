package com.example.jurisHub.service.impl;

import com.example.jurisHub.dto.forum.VoteDto;
import com.example.jurisHub.entity.*;
import com.example.jurisHub.repository.*;
import com.example.jurisHub.service.NotificationService;
import com.example.jurisHub.service.VotingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VotingServiceImpl implements VotingService {
    private final PostVoteRepository postVoteRepository;
    private final ReplyVoteRepository replyVoteRepository;
    private final ForumRepository forumRepository;
    private final PostReplyRepository replyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public VoteDto votePost(Long postId, Long userId, String voteTypeStr) {
        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<PostVote> existingVote = postVoteRepository.findByPostIdAndUserId(postId, userId);

        if ("NONE".equals(voteTypeStr)) {
            if (existingVote.isPresent()) {
                PostVote vote = existingVote.get();
                if (vote.getVoteType() == PostVote.VoteType.UPVOTE) {
                    int currentCount = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0;
                    post.setUpvoteCount(Math.max(0, currentCount - 1));
                } else {
                    int currentCount = post.getDownvoteCount() != null ? post.getDownvoteCount() : 0;
                    post.setDownvoteCount(Math.max(0, currentCount - 1));
                }
                postVoteRepository.delete(vote);
                forumRepository.save(post);
                System.out.println("Removed vote, new counts: upvote=" + post.getUpvoteCount() + ", downvote=" + post.getDownvoteCount());
            }
            return getPostVoteStats(postId, userId);
        }

        PostVote.VoteType voteType = PostVote.VoteType.valueOf(voteTypeStr);

        if (existingVote.isPresent()) {
            PostVote vote = existingVote.get();
            if (vote.getVoteType() != voteType) {
                if (vote.getVoteType() == PostVote.VoteType.UPVOTE) {
                    int upCount = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0;
                    int downCount = post.getDownvoteCount() != null ? post.getDownvoteCount() : 0;
                    post.setUpvoteCount(Math.max(0, upCount - 1));
                    post.setDownvoteCount(downCount + 1);
                } else {
                    int upCount = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0;
                    int downCount = post.getDownvoteCount() != null ? post.getDownvoteCount() : 0;
                    post.setDownvoteCount(Math.max(0, downCount - 1));
                    post.setUpvoteCount(upCount + 1);
                }
                vote.setVoteType(voteType);
                postVoteRepository.save(vote);
                System.out.println("Switched vote type to: " + voteType);
            }
        } else {
            PostVote vote = PostVote.builder()
                    .post(post)
                    .user(user)
                    .voteType(voteType)
                    .build();
            PostVote savedVote = postVoteRepository.save(vote);
            System.out.println("Created new vote: ID=" + savedVote.getId() + ", User=" + userId + ", Post=" + postId + ", Type=" + voteType);

            if (voteType == PostVote.VoteType.UPVOTE) {
                int currentCount = post.getUpvoteCount() != null ? post.getUpvoteCount() : 0;
                post.setUpvoteCount(currentCount + 1);
                System.out.println("Incremented upvote count to: " + post.getUpvoteCount());
                if (!post.getAuthor().getId().equals(userId)) {
                    notificationService.createNotification(
                            post.getAuthor().getId(),
                            Notification.NotificationType.UPVOTE,
                            user.getFullName() + " đã upvote bài viết của bạn: " + post.getTitle(),
                            postId,
                            "POST"
                    );
                }
            } else {
                int currentCount = post.getDownvoteCount() != null ? post.getDownvoteCount() : 0;
                post.setDownvoteCount(currentCount + 1);
                System.out.println("Incremented downvote count to: " + post.getDownvoteCount());
            }
        }

        Post savedPost = forumRepository.save(post);
        System.out.println("Saved post with upvote=" + savedPost.getUpvoteCount() + ", downvote=" + savedPost.getDownvoteCount());
        return getPostVoteStats(postId, userId);
    }

    @Override
    @Transactional
    public VoteDto voteReply(Long replyId, Long userId, String voteTypeStr) {
        PostReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<ReplyVote> existingVote = replyVoteRepository.findByReplyIdAndUserId(replyId, userId);

        if ("NONE".equals(voteTypeStr)) {
            if (existingVote.isPresent()) {
                ReplyVote vote = existingVote.get();
                if (vote.getVoteType() == ReplyVote.VoteType.UPVOTE) {
                    int currentCount = reply.getUpvoteCount() != null ? reply.getUpvoteCount() : 0;
                    reply.setUpvoteCount(Math.max(0, currentCount - 1));
                } else {
                    int currentCount = reply.getDownvoteCount() != null ? reply.getDownvoteCount() : 0;
                    reply.setDownvoteCount(Math.max(0, currentCount - 1));
                }
                replyVoteRepository.delete(vote);
                replyRepository.save(reply);
                System.out.println("Removed reply vote, new counts: upvote=" + reply.getUpvoteCount() + ", downvote=" + reply.getDownvoteCount());
            }
            return getReplyVoteStats(replyId, userId);
        }

        ReplyVote.VoteType voteType = ReplyVote.VoteType.valueOf(voteTypeStr);

        if (existingVote.isPresent()) {
            ReplyVote vote = existingVote.get();
            if (vote.getVoteType() != voteType) {
                if (vote.getVoteType() == ReplyVote.VoteType.UPVOTE) {
                    int upCount = reply.getUpvoteCount() != null ? reply.getUpvoteCount() : 0;
                    int downCount = reply.getDownvoteCount() != null ? reply.getDownvoteCount() : 0;
                    reply.setUpvoteCount(Math.max(0, upCount - 1));
                    reply.setDownvoteCount(downCount + 1);
                } else {
                    int upCount = reply.getUpvoteCount() != null ? reply.getUpvoteCount() : 0;
                    int downCount = reply.getDownvoteCount() != null ? reply.getDownvoteCount() : 0;
                    reply.setDownvoteCount(Math.max(0, downCount - 1));
                    reply.setUpvoteCount(upCount + 1);
                }
                vote.setVoteType(voteType);
                replyVoteRepository.save(vote);
                System.out.println("Switched reply vote type to: " + voteType);
            }
        } else {
            ReplyVote vote = ReplyVote.builder()
                    .reply(reply)
                    .user(user)
                    .voteType(voteType)
                    .build();
            ReplyVote savedVote = replyVoteRepository.save(vote);
            System.out.println("Created new reply vote: ID=" + savedVote.getId() + ", User=" + userId + ", Reply=" + replyId + ", Type=" + voteType);

            if (voteType == ReplyVote.VoteType.UPVOTE) {
                int currentCount = reply.getUpvoteCount() != null ? reply.getUpvoteCount() : 0;
                reply.setUpvoteCount(currentCount + 1);
                System.out.println("Incremented reply upvote count to: " + reply.getUpvoteCount());
                if (!reply.getAuthor().getId().equals(userId)) {
                    notificationService.createNotification(
                            reply.getAuthor().getId(),
                            Notification.NotificationType.UPVOTE,
                            user.getFullName() + " đã upvote câu trả lời của bạn",
                            replyId,
                            "REPLY"
                    );
                }
            } else {
                int currentCount = reply.getDownvoteCount() != null ? reply.getDownvoteCount() : 0;
                reply.setDownvoteCount(currentCount + 1);
                System.out.println("Incremented reply downvote count to: " + reply.getDownvoteCount());
            }
        }

        PostReply savedReply = replyRepository.save(reply);
        System.out.println("Saved reply with upvote=" + savedReply.getUpvoteCount() + ", downvote=" + savedReply.getDownvoteCount());
        return getReplyVoteStats(replyId, userId);
    }

    public VoteDto getPostVoteStats(Long postId, Long userId) {
        Post post = forumRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        String userVote = null;
        if (userId != null) {
            Optional<PostVote> vote = postVoteRepository.findByPostIdAndUserId(postId, userId);
            if (vote.isPresent()) {
                userVote = vote.get().getVoteType().name();
            }
        }

        return VoteDto.builder()
                .upvoteCount(post.getUpvoteCount())
                .downvoteCount(post.getDownvoteCount())
                .userVote(userVote)
                .build();
    }

    public VoteDto getReplyVoteStats(Long replyId, Long userId) {
        PostReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new RuntimeException("Reply not found"));

        String userVote = null;
        if (userId != null) {
            Optional<ReplyVote> vote = replyVoteRepository.findByReplyIdAndUserId(replyId, userId);
            if (vote.isPresent()) {
                userVote = vote.get().getVoteType().name();
            }
        }

        return VoteDto.builder()
                .upvoteCount(reply.getUpvoteCount())
                .downvoteCount(reply.getDownvoteCount())
                .userVote(userVote)
                .build();
    }
}
