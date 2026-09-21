package com.example.jurisHub.service;

import com.example.jurisHub.dto.forum.VoteDto;

public interface VotingService {
    VoteDto votePost(Long postId, Long userId, String voteTypeStr);
    VoteDto voteReply(Long replyId, Long userId, String voteTypeStr);
    VoteDto getPostVoteStats(Long postId, Long userId);
    VoteDto getReplyVoteStats(Long replyId, Long userId);
}
