package com.crowdmonitor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Small, bounded executor for @Async work (currently just background audit
 * log writes — see AuditLogWriter). Named "taskExecutor" so it's picked up
 * automatically as the default executor for every @Async method in the app,
 * instead of Spring's fallback SimpleAsyncTaskExecutor, which spins up an
 * unbounded new thread per call.
 */
@Configuration
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("audit-async-");
        executor.initialize();
        return executor;
    }
}
