package com.example.jurisHub.dto.sentiment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SentimentResult {
    private String text;
    private String sentiment; // "positive", "neutral", "negative"
    private String label;
    private double score;
}
