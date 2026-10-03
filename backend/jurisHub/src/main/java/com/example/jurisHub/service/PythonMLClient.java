package com.example.jurisHub.service;

import com.example.jurisHub.dto.sentiment.SentimentResult;

public interface PythonMLClient {

    SentimentResult analyzeSentiment(String text);

}
