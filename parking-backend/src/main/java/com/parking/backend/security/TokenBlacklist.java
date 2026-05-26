package com.parking.backend.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenBlacklist {
    
    // Store username and the timestamp when they were suspended
    private final Map<String, Long> suspendedAccounts = new ConcurrentHashMap<>();

    public void suspendAccount(String username) {
        suspendedAccounts.put(username, System.currentTimeMillis());
    }

    public void reactivateAccount(String username) {
        suspendedAccounts.remove(username);
    }

    public boolean isSuspended(String username) {
        return suspendedAccounts.containsKey(username);
    }
}
