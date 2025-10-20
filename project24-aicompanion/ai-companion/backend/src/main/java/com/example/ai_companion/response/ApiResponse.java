package com.example.ai_companion.response;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * DTO for standardizing the structure of API responses.
 * This class holds the response status, message, data, and timestamp.
 */
@Getter
@Setter
public class ApiResponse {
    
    /**
     * The timestamp when the response is created.
     */
    private LocalDateTime timestamp;
    
    /**
     * The HTTP status code of the response.
     */
    private int status;
    
    /**
     * A message providing additional context or description for the response.
     */
    private Object message;
    
    /**
     * The data being returned in the response. Can be any object.
     */
    private Object data;

    /**
     * Constructor to initialize an ApiResponse with the provided status, message, and data.
     *
     * @param status the HTTP status code
     * @param message the message providing context for the response
     * @param data the data to be included in the response
     */
    public ApiResponse(int status, Object message, Object data) {
        this.timestamp = LocalDateTime.now(); 
        this.status = status;
        this.message = message;
        this.data = data;
    }

}
