package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostVoteRepository extends JpaRepository<PostVote, Long> {

    Optional<PostVote> findByPostIdAndUserId(Long postId, Long userId);
}
