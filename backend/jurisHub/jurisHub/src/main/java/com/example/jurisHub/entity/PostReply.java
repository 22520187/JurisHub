package com.example.jurisHub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "post_replies", indexes = {
        @Index(name = "idx_post_replies_post_id", columnList = "post_id"),

        @Index(name = "idx_post_replies_author_id", columnList = "author_id"),

        @Index(name = "idx_post_replies_is_active", columnList = "is_active"),

        @Index(name = "idx_post_replies_created_at", columnList = "created_at DESC"),

        @Index(name = "idx_post_replies_post_active", columnList = "post_id, is_active, created_at DESC"),

        @Index(name = "idx_post_replies_parent_id", columnList = "parent_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostReply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private PostReply parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostReply> children;

    @OneToMany(mappedBy = "reply", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ReplyVote> votes;

    @OneToMany(mappedBy = "reply", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Mention> mentions;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_solution")
    private Boolean isSolution = false; // Mark reply as solution to the post

    @Column(name = "upvote_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer upvoteCount = 0;

    @Column(name = "downvote_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer downvoteCount = 0;

    @Column(name = "mentioned_user_ids")
    private String mentionedUserIds; // Comma-separated user IDs

    @Column(name = "sentiment_label")
    private String sentimentLabel; // positive, neutral, negative

    @Column(name = "sentiment_score")
    private Double sentimentScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
