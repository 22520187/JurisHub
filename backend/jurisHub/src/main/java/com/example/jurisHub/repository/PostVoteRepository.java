package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostVoteRepository extends JpaRepository<PostVote, Long> {

    Optional<PostVote> findByPostIdAndUserId(Long postId, Long userId);

    /**
     * Analytics: Count votes by date and vote type
     */
    @Query("SELECT DATE(v.createdAt) as date, COUNT(v) as count " +
            "FROM PostVote v " +
            "WHERE v.createdAt >= :startDate AND v.voteType = :voteType " +
            "GROUP BY DATE(v.createdAt) " +
            "ORDER BY date")
    List<Object[]> countVotesByDateAndType(
            @Param("startDate") LocalDateTime startDate,
            @Param("voteType") PostVote.VoteType voteType
    );

    /**
     * Analytics: Count upvotes by date
     */
    default List<Object[]> countUpvotesGroupedByDate(LocalDateTime startDate) {
        return countVotesByDateAndType(startDate, PostVote.VoteType.UPVOTE);
    }
}
