package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostVoteRepository extends JpaRepository<PostVote, Long> {

    Optional<PostVote> findByPostIdAndUserId(Long postId, Long userId);

    /**
     * Analytics: Count votes by date
     */
    @Query("SELECT DATE(v.createdAt) as date, COUNT(v) as count " +
            "FROM PostVote v " +
            "WHERE v.createdAt >= :startDate AND v.voteType = com.example.legal_connect.entity.PostVote.VoteType.UPVOTE " +
            "GROUP BY DATE(v.createdAt) " +
            "ORDER BY date")
    java.util.List<Object[]> countUpvotesGroupedByDate(@Param("startDate") java.time.LocalDateTime startDate);
}
