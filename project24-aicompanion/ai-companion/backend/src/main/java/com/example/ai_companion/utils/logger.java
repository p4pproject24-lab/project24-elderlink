package com.example.ai_companion.utils;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;

public class logger {

    private static final String BASE_PATH = "logs/";

    public static void logToFile(String userId, String logContent) {
        try {
            File dir = new File(BASE_PATH);
            if (!dir.exists()) {
                dir.mkdirs(); // Create the logs/ directory if it doesn't exist
            }

            String filename = BASE_PATH + "user_" + userId + "_log.txt";
            try (FileWriter writer = new FileWriter(filename, true)) {
                writer.write("==== [" + LocalDateTime.now() + "] ====\n");
                writer.write(logContent);
                writer.write("\n\n");
            }

        } catch (IOException e) {
            System.err.println("Logging failed: " + e.getMessage());
        }
    }

}