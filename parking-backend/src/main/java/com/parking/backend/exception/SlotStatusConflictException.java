package com.parking.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class SlotStatusConflictException extends RuntimeException {
    public SlotStatusConflictException(String message) {
        super(message);
    }
}
