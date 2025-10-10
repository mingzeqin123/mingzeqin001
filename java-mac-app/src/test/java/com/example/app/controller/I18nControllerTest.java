package com.example.app.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.MessageSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;

import java.util.Locale;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for i18n functionality
 */
@SpringBootTest
@AutoConfigureWebMvc
class I18nControllerTest {

    @Autowired
    private MessageSource messageSource;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testMessageSourceWithEnglish() {
        String message = messageSource.getMessage("app.title", null, Locale.ENGLISH);
        assert message.equals("Mac Java Application v1.0");
    }

    @Test
    void testMessageSourceWithChinese() {
        String message = messageSource.getMessage("app.title", null, Locale.SIMPLIFIED_CHINESE);
        assert message.equals("Mac Java 应用程序 v1.0");
    }

    @Test
    void testMessageSourceWithParameters() {
        String message = messageSource.getMessage("message.current.time", 
            new Object[]{"2024-01-01 12:00:00"}, Locale.ENGLISH);
        assert message.equals("Current time: 2024-01-01 12:00:00");
    }

    @Test
    void testGetMessagesEndpoint() throws Exception {
        mockMvc.perform(get("/api/i18n/messages?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.app.title").value("Mac Java Application v1.0"));
    }

    @Test
    void testGetMessagesEndpointChinese() throws Exception {
        mockMvc.perform(get("/api/i18n/messages?lang=zh_CN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.app.title").value("Mac Java 应用程序 v1.0"));
    }

    @Test
    void testGetSpecificMessage() throws Exception {
        mockMvc.perform(get("/api/i18n/message/app.title?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("app.title"))
                .andExpect(jsonPath("$.message").value("Mac Java Application v1.0"))
                .andExpect(jsonPath("$.locale").value("en"));
    }

    @Test
    void testGetSystemInfo() throws Exception {
        mockMvc.perform(get("/api/i18n/system-info?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("System Information"))
                .andExpect(jsonPath("$.data.os").exists())
                .andExpect(jsonPath("$.data.javaVersion").exists());
    }

    @Test
    void testGetGreeting() throws Exception {
        mockMvc.perform(get("/api/i18n/greeting?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Hello! Welcome to this Java application!"))
                .andExpect(jsonPath("$.locale").value("en"));
    }

    @Test
    void testGetStartupMessage() throws Exception {
        mockMvc.perform(get("/api/i18n/startup?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value("Application started successfully!"))
                .andExpect(jsonPath("$.locale").value("en"));
    }
}