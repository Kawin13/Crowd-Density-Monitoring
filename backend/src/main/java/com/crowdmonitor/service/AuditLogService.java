package com.crowdmonitor.service;

import com.crowdmonitor.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Thin, synchronous entry point for audit logging.
 *
 * ROOT-CAUSE FIX (previously, audit writes could stall unrelated requests):
 * the actual DB write now happens entirely off the request thread, in
 * AuditLogWriter (a separate @Async bean — see that class for why it has
 * to be separate rather than a method here). This method's only job is to
 * capture the currently authenticated username SYNCHRONOUSLY, because
 * SecurityContextHolder is thread-local and would be empty by the time an
 * @Async method runs on a pooled worker thread. It then hands off plain
 * data and returns immediately.
 *
 * We saw this fail in production: writing the "USER_ADDED" audit entry hit
 * a MySQL "Lock wait timeout exceeded" (error 1205) while blocked behind an
 * unrelated open transaction elsewhere on the DB. That write used to run
 * synchronously on the request thread, so the create-user HTTP call sat
 * there for up to innodb_lock_wait_timeout (default 50s) before the
 * (caught, non-fatal) audit failure let the response go out — long after
 * the frontend's 30s axios timeout had already given up and shown
 * "Create failed", even though the user had already been created and
 * committed seconds earlier. Moving the write off-thread means that kind
 * of DB-side contention can never again add latency to a user-facing
 * request, no matter what else is happening on the database.
 */
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogWriter auditLogWriter;

    public void log(String action, String entityType, Long entityId, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        auditLogWriter.write(username, action, entityType, entityId, details);
    }

    /** Convenience overload for a specific acting user (e.g. right after login,
     *  before the SecurityContext may be fully populated on this thread). */
    public void logForUser(User user, String action, String entityType, Long entityId, String details) {
        auditLogWriter.write(user != null ? user.getUsername() : null, action, entityType, entityId, details);
    }
}
