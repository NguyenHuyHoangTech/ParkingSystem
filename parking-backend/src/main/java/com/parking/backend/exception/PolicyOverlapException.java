package com.parking.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class PolicyOverlapException extends RuntimeException {
    public PolicyOverlapException(String message) {
        super(message);
    }
}
