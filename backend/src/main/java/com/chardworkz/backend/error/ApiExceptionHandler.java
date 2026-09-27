package com.chardworkz.backend.error;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

/**
 * {@code application.properties}' own {@code server.error.include-message=always}
 * documents the intent that every {@link ResponseStatusException} reason in this
 * codebase (an author-written message, never a stack trace) should reach the
 * client as {@code message} - verified live it does not, for pre-existing
 * endpoints too (e.g. {@code ReportsController}'s "Unknown branch"), not just
 * newly added ones. This restores that documented intent directly rather than
 * depending on a property that isn't actually taking effect.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", ex.getReason());
        return ResponseEntity.status(status).body(body);
    }

    /**
     * Without this, a {@code @Valid @RequestBody} rejection (e.g. {@code CreateAccountRequest}'s
     * password {@code @Size(min = 8)}) never reaches the frontend's {@code backendErrorMessage()}
     * helper - {@link MethodArgumentNotValidException} isn't a {@link ResponseStatusException},
     * so it fell through to Spring's own default body with no top-level {@code message} string,
     * and every caller silently showed its generic fallback text instead of the real reason.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError != null
            ? fieldError.getField() + " " + fieldError.getDefaultMessage()
            : "Validation failed.";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** Without this, exceeding {@code spring.servlet.multipart.max-file-size} surfaces as a raw 500 instead of a clean, actionable rejection. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        body.put("error", HttpStatus.PAYLOAD_TOO_LARGE.getReasonPhrase());
        body.put("message", "The uploaded file is too large. Split it into smaller files and try again.");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }
}
