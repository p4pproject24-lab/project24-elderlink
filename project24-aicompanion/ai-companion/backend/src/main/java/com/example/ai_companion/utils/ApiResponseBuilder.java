package com.example.ai_companion.utils;

import com.example.ai_companion.response.ApiResponse;
import com.example.ai_companion.response.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for building standardised API responses.
 * <p>
 * Provides convenient methods to construct {@link ResponseEntity} objects
 * with an {@link ApiResponse} body, including support for wrapping user responses
 * and formatting field-level validation errors.
 */
public class ApiResponseBuilder {

    /**
     * Builds a standardized API response with the given status, message, and data.
     * <p>
     * If the provided data is an instance of {@link UserResponse}, it will be
     * wrapped in a map with the key "user" for consistency in frontend parsing.
     *
     * @param status  the HTTP status to return
     * @param message a descriptive message or payload
     * @param data    any response data (can be null)
     * @return a {@link ResponseEntity} containing the structured {@link ApiResponse}
     */
    public static ResponseEntity<ApiResponse> build(HttpStatus status, Object message, Object data) {
        if (data instanceof UserResponse) {
            Map<String, Object> wrappedData = new HashMap<>();
            wrappedData.put("user", data);
            data = wrappedData;
        }

        ApiResponse response = new ApiResponse(
                status.value(),
                message,
                data
        );
        return new ResponseEntity<>(response, status);
    }

    /**
     * Builds a standardized API response with only status and message.
     * The data field will be null.
     *
     * @param status  the HTTP status to return
     * @param message a descriptive message or payload
     * @return a {@link ResponseEntity} containing the structured {@link ApiResponse}
     */
    public static ResponseEntity<ApiResponse> build(HttpStatus status, Object message) {
        return build(status, message, null);
    }

    /**
     * Builds an API response representing a validation error for a single field.
     *
     * @param status  the HTTP status to return
     * @param field   the name of the field that has an error
     * @param message the error message associated with the field
     * @return a {@link ResponseEntity} with a field-level error structure
     */
    public static ResponseEntity<ApiResponse> buildFieldError(HttpStatus status, String field, String message) {
        Map<String, String> fieldError = new HashMap<>();
        fieldError.put(field, message);
        return build(status, fieldError, null);
    }

    /**
     * Builds an API response representing validation errors for multiple fields.
     *
     * @param status the HTTP status to return
     * @param errors a 2D array where each sub-array contains a field name and its error message
     * @return a {@link ResponseEntity} with all field-level error messages
     */
    public static ResponseEntity<ApiResponse> buildFieldErrors(HttpStatus status, String[][] errors) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (String[] error : errors) {
            fieldErrors.put(error[0], error[1]);
        }
        return build(status, fieldErrors, null);
    }
}
