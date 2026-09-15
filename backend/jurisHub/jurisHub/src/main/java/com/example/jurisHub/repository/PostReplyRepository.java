package com.example.jurisHub.repository;

import com.example.jurisHub.entity.PostReply;
import com.example.jurisHub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PostReplyRepository extends JpaRepository<PostReply, Long> {

    long countByAuthorAndIsActiveTrue(User author);
}
