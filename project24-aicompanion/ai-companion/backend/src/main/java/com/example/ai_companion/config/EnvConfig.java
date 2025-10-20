package com.example.ai_companion.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Properties;

@Configuration
public class EnvConfig {

    @PostConstruct
    public void loadEnvFile() {
        try {
            // Try to load from current directory first
            String envPath = ".env";
            if (!Files.exists(Paths.get(envPath))) {
                // Try parent directory
                envPath = "../.env";
            }
            
            if (Files.exists(Paths.get(envPath))) {
                System.out.println("Loading environment variables from: " + envPath);
                Properties props = new Properties();
                props.load(Files.newInputStream(Paths.get(envPath)));
                
                // Set system properties for each environment variable
                props.forEach((key, value) -> {
                    if (System.getProperty((String) key) == null) {
                        System.setProperty((String) key, (String) value);
                        System.out.println("Set system property: " + key + " = " + value);
                    }
                });
            } else {
                System.out.println("No .env file found in current or parent directory");
            }
        } catch (IOException e) {
            System.err.println("Error loading .env file: " + e.getMessage());
        }
    }
}
