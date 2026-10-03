package com.example.jurisHub.repository;

import com.example.jurisHub.entity.ReplyVote;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReplyVoteRepository extends CrudRepository<ReplyVote, Long> {
    Optional<ReplyVote> findByReplyIdAndUserId(Long replyId, Long userId);
}
