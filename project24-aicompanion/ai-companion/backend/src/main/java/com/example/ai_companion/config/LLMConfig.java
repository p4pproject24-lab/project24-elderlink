package com.example.ai_companion.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LLMConfig {

    private final String openAiApiKey;

    public LLMConfig() {
        // Load .env file
        Dotenv dotenv = Dotenv.load();
        this.openAiApiKey = dotenv.get("OPENAI_API_KEY", "demo");
    }

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OpenAiChatModel.builder()
                .apiKey(openAiApiKey)
                .defaultRequestParameters(ChatRequestParameters.builder()
                        .modelName("gpt-4o-mini")
                        .temperature(0.7)
                        .build())
                .build();
    }
}
