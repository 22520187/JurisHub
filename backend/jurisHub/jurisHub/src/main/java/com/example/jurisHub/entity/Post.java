package com.example.jurisHub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "posts", indexes = {
        @Index(name = "idx_posts_category_id", columnList = "category_id"),

        @Index(name = "idx_posts_author_id", columnList = "author_id"),

        @Index(name = "idx_posts_is_active", columnList = "is_active"),

        @Index(name = "idx_posts_created_at", columnList = "created_at DESC"),

        @Index(name = "idx_posts_active_created", columnList = "is_active, created_at DESC"),

        @Index(name = "idx_posts_category_active_created", columnList = "category_id, is_active, created_at DESC"),

        @Index(name = "idx_posts_views", columnList = "views DESC"),

        @Index(name = "idx_posts_reply_count", columnList = "reply_count DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 255)
    private String slug;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private PostCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "views", columnDefinition = "INTEGER DEFAULT 0")
    private Integer views = 0;

    @Column(name = "reply_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer replyCount = 0;

    @Column(name = "upvote_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer upvoteCount = 0;

    @Column(name = "downvote_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer downvoteCount = 0;

    @Column(name = "is_pinned")
    private Boolean pinned = false;

    @Column(name = "is_solved")
    private Boolean solved = false;

    @Column(name = "is_hot")
    private Boolean isHot = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "report_count", columnDefinition = "INTEGER DEFAULT 0")
    private Integer reportCount = 0;

    @Column(name = "is_reported")
    private Boolean isReported = false;

    @Column(name = "violation_reason")
    private String violationReason;

    @Column(name = "tags")
    private String tags;

    @Column(name = "sentiment_label")
    private String sentimentLabel; // positive, neutral, negative

    @Column(name = "sentiment_score")
    private Double sentimentScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_reply_at")
    private LocalDateTime lastReplyAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostReply> replies;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostVote> votes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "post_label_mapping",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    @BatchSize(size = 25)
    private Set<PostLabel> labels = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (slug == null || slug.isEmpty()) {
            slug = generateSlug(title);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private String generateSlug(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        String slug = text.toLowerCase();

        slug = slug.replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a");
        slug = slug.replaceAll("[èéẹẻẽêềếệểễ]", "e");
        slug = slug.replaceAll("[ìíịỉĩ]", "i");
        slug = slug.replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o");
        slug = slug.replaceAll("[ùúụủũưừứựửữ]", "u");
        slug = slug.replaceAll("[ỳýỵỷỹ]", "y");
        slug = slug.replaceAll("đ", "d");

        slug = slug.replaceAll("[^a-z0-9\\s-]", "");

        slug = slug.trim().replaceAll("[\\s-]+", "-");

        slug = slug.replaceAll("^-+|-+$", "");

        if (slug.length() > 200) {
            slug = slug.substring(0, 200);
            int lastHyphen = slug.lastIndexOf('-');
            if (lastHyphen > 0) {
                slug = slug.substring(0, lastHyphen);
            }
        }

        return slug;
    }

    public Set<String> getTagsSet() {
        if (tags == null || tags.trim().isEmpty()) {
            return new HashSet<>();
        }
        return Set.of(tags.split(","));
    }

    public void setTagsFromSet(Set<String> tagsSet) {
        this.tags = tagsSet != null ? String.join(",", tagsSet) : null;
    }

    public void incrementViews() {
        this.views = (this.views != null ? this.views : 0) + 1;
    }

    public void updateReplyCount() {
        this.replyCount = replies != null ? replies.size() : 0;
    }

    public void updateLastReplyTime() {
        this.lastReplyAt = LocalDateTime.now();
    }

    public void addReport() {
        this.reportCount = (this.reportCount != null ? this.reportCount : 0) + 1;
        this.isReported = true;
    }

    public void clearReports() {
        this.reportCount = 0;
        this.isReported = false;
        this.violationReason = null;
    }

    public boolean hasReports() {
        return this.reportCount != null && this.reportCount > 0;
    }
}
