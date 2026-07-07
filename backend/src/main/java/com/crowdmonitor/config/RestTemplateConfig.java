package com.crowdmonitor.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Provides a shared RestTemplate bean for communication between
 * Spring Boot backend and FastAPI AI service.
 *
 * Increased timeout values are required because:
 * - Render free tier services may need time to wake up.
 * - YOLOv8 model loading can take several seconds.
 * - Video/stream analysis requires more processing time.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {

        return builder
                // Time allowed to establish connection with AI service
                .setConnectTimeout(Duration.ofSeconds(60))

                // Time allowed for YOLO inference / video processing response
                .setReadTimeout(Duration.ofSeconds(180))

                .build();
    }
}