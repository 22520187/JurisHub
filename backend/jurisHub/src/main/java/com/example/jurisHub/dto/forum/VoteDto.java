package com.example.jurisHub.dto.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteDto {
    private String voteType; // UPVOTE, DOWNVOTE, or null if no vote

    private Integer upvoteCount;

    private Integer downvoteCount;

    private String userVote; // Current user's vote (UPVOTE/DOWNVOTE/null)
}
