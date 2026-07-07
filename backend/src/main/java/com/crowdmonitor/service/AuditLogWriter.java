package com.crowdmonitor.service;

import com.crowdmonitor.entity.AuditLog;
import com.crowdmonitor.repository.AuditLogRepository;
import com.crowdmonitor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Does the actual audit_logs INSERT, fully off the request thread.
 *
 * Kept as a separate bean (rather than a method on AuditLogService) on
 * purpose: Spring's @Async/@Transactional proxies only intercept calls that
 * come in from OUTSIDE the bean. If this method lived on AuditLogService
 * and were called as `this.writeAsync(...)` from another method on that
 * same class (self-invocation), both annotations would be silently
 * ignored and the write would run synchronously, inline, on the caller's
 * thread and transaction — exactly the bug we're fixing. Calling into a
 * separate bean guarantees the proxy (and therefore @Async/REQUIRES_NEW)
 * actually applies.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogWriter {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(String username, String action, String entityType, Long entityId, String details) {
        try {
            AuditLog entry = new AuditLog();
            entry.setUser(username != null ? userRepository.findByUsername(username).orElse(null) : null);
            entry.setAction(action);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setDetails(details);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Auditing must never break (or even slow down) the calling
            // business operation — it already returned to the caller.
            log.warn("Failed to write audit log for action '{}': {}", action, e.getMessage());
        }
    }
}
