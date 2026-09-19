package com.example.jurisHub.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String SENTIMENT_QUEUE = "sentiment.analysis.queue";
    public static final String SENTIMENT_EXCHANGE = "sentiment.analysis.exchange";
    public static final String SENTIMENT_ROUTING_KEY = "sentiment.analysis.key";

    @Bean
    public Queue sentimentQueue() {
        return new Queue(SENTIMENT_QUEUE, true);
    }

    @Bean
    public DirectExchange sentimentExchange() {
        return new DirectExchange(SENTIMENT_EXCHANGE);
    }

    @Bean
    public Binding sentimentBinding(Queue sentimentQueue, DirectExchange sentimentExchange) {
        return BindingBuilder.bind(sentimentQueue).to(sentimentExchange).with(SENTIMENT_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
