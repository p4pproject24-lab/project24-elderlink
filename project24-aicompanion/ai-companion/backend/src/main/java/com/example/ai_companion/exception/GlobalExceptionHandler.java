package com.example.ai_companion.exception;

import com.example.ai_companion.response.ApiResponse;
import com.example.ai_companion.utils.ApiResponseBuilder;

import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Global exception handler for handling exceptions thrown across the entire application.
 * It provides centralized handling of validation errors and unexpected exceptions.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * Constructor to initialize the exception handler with the message source for localization.
     * 
     * @param messageSource the message source for resolving validation error messages
     */
    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /**
     * Handles MethodArgumentNotValidException, which occurs when validation fails for request arguments.
     * 
     * @param ex the MethodArgumentNotValidException thrown
     * @param locale the locale to resolve localized error messages
     * @return a ResponseEntity containing an ApiResponse with validation error details
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationExceptions(MethodArgumentNotValidException ex, Locale locale) {
        Map<String, String> errors = new HashMap<>();
        
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            String localizedMessage = messageSource.getMessage(error, locale);
            errors.put(error.getField(), localizedMessage);
        }

        return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, errors, null);
    }

    /**
     * Handles all other exceptions that are not specifically handled.
     * 
     * @param ex the Exception thrown
     * @return a ResponseEntity containing an ApiResponse with the error details
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleAllExceptions(Exception ex) {

        Map<String, String> errorMessage = Map.of("error", "An unexpected error occurred: " + ex.getMessage());
        
        return ApiResponseBuilder.build(HttpStatus.INTERNAL_SERVER_ERROR, errorMessage, null);
    }

    @ExceptionHandler(UserProfileValidationException.class)
    public ResponseEntity<ApiResponse> handleUserProfileValidation(UserProfileValidationException ex) {
        return ApiResponseBuilder.build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }
}
