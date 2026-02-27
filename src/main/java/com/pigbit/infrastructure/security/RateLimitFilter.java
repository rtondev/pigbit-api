package com.pigbit.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pigbit.application.exception.ErrorResponse;
import com.pigbit.infrastructure.redis.RedisService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private static final long ONE_MINUTE_MS = 60_000L;

    private final ObjectMapper objectMapper;
    private final RedisService redisService;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, RateLimitPolicy> policies = Map.of(
            "/api/v1/auth/login", new RateLimitPolicy(5, ONE_MINUTE_MS),
            "/api/v1/auth/login/2fa", new RateLimitPolicy(5, ONE_MINUTE_MS),
            "/api/v1/auth/password-reset/request", new RateLimitPolicy(3, ONE_MINUTE_MS),
            "/api/v1/auth/password-reset/confirm", new RateLimitPolicy(3, ONE_MINUTE_MS),
            "/api/v1/auth/register", new RateLimitPolicy(2, ONE_MINUTE_MS),
            "/api/v1/auth/register/confirm", new RateLimitPolicy(2, ONE_MINUTE_MS)
    );

    public RateLimitFilter(ObjectMapper objectMapper, RedisService redisService) {
        this.objectMapper = objectMapper;
        this.redisService = redisService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        RateLimitPolicy policy = policies.get(path);
        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = "rate:" + path + ":" + getClientIp(request);
        Boolean redisAllowed = tryConsumeRedis(key, policy);
        boolean allowed = redisAllowed != null ? redisAllowed : tryConsumeLocal(key, policy);
        if (!allowed) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            objectMapper.writeValue(response.getWriter(), new ErrorResponse(
                    "Rate limit excedido. Tente novamente em instantes.",
                    HttpStatus.TOO_MANY_REQUESTS.value(),
                    java.time.LocalDateTime.now(),
                    null
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Boolean tryConsumeRedis(String key, RateLimitPolicy policy) {
        Long count = redisService.increment(key, Duration.ofMillis(policy.refillIntervalMs));
        if (count == null) {
            return null;
        }
        return count <= policy.capacity;
    }

    private boolean tryConsumeLocal(String key, RateLimitPolicy policy) {
        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket(policy));
        return bucket.tryConsume();
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateLimitPolicy {
        private final int capacity;
        private final long refillIntervalMs;

        private RateLimitPolicy(int capacity, long refillIntervalMs) {
            this.capacity = capacity;
            this.refillIntervalMs = refillIntervalMs;
        }
    }

    private static class Bucket {
        private final RateLimitPolicy policy;
        private int tokens;
        private long lastRefillMs;

        private Bucket(RateLimitPolicy policy) {
            this.policy = policy;
            this.tokens = policy.capacity;
            this.lastRefillMs = System.currentTimeMillis();
        }

        private synchronized boolean tryConsume() {
            refillIfNeeded();
            if (tokens <= 0) {
                return false;
            }
            tokens -= 1;
            return true;
        }

        private void refillIfNeeded() {
            long now = System.currentTimeMillis();
            if (now - lastRefillMs >= policy.refillIntervalMs) {
                tokens = policy.capacity;
                lastRefillMs = now;
            }
        }
    }
}
