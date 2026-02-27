package com.pigbit.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private StringRedisTemplate stringRedisTemplate;

    public boolean isAvailable() {
        if (stringRedisTemplate == null) {
            return false;
        }
        try {
            stringRedisTemplate.hasKey("redis:ping");
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    public Optional<String> getString(String key) {
        if (!isAvailable()) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(stringRedisTemplate.opsForValue().get(key));
        } catch (RuntimeException ex) {
            return Optional.empty();
        }
    }

    public void setString(String key, String value, Duration ttl) {
        if (!isAvailable()) {
            return;
        }
        try {
            stringRedisTemplate.opsForValue().set(key, value, ttl);
        } catch (RuntimeException ignored) {
        }
    }

    public void delete(String key) {
        if (!isAvailable()) {
            return;
        }
        try {
            stringRedisTemplate.delete(key);
        } catch (RuntimeException ignored) {
        }
    }

    public Long increment(String key, Duration ttl) {
        if (!isAvailable()) {
            return null;
        }
        try {
            Long value = stringRedisTemplate.opsForValue().increment(key);
            if (value != null && value == 1L) {
                stringRedisTemplate.expire(key, ttl);
            }
            return value;
        } catch (RuntimeException ex) {
            return null;
        }
    }

    public Long getTtlSeconds(String key) {
        if (!isAvailable()) {
            return null;
        }
        try {
            return stringRedisTemplate.getExpire(key);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    public <T> Optional<T> getJson(String key, Class<T> type) {
        if (!isAvailable()) {
            return Optional.empty();
        }
        try {
            String raw = stringRedisTemplate.opsForValue().get(key);
            if (raw == null) {
                return Optional.empty();
            }
            return Optional.of(objectMapper.readValue(raw, type));
        } catch (RuntimeException ex) {
            return Optional.empty();
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    public void setJson(String key, Object value, Duration ttl) {
        if (!isAvailable()) {
            return;
        }
        try {
            String raw = objectMapper.writeValueAsString(value);
            stringRedisTemplate.opsForValue().set(key, raw, ttl);
        } catch (RuntimeException ignored) {
        } catch (Exception ignored) {
        }
    }
}
