package com.parking.backend.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class TimeService {
    private Duration offset = Duration.ZERO;

    public void addHours(long hours) {
        offset = offset.plusHours(hours);
    }

    public void addMinutes(long minutes) {
        offset = offset.plusMinutes(minutes);
    }

    public void reset() {
        offset = Duration.ZERO;
    }

    public LocalDateTime now() {
        return LocalDateTime.now().plus(offset);
    }
}
