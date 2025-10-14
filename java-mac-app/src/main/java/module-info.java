module mac.java.app {
    requires javafx.controls;
    requires javafx.fxml;
    requires java.desktop;
    
    // Spring Boot and web dependencies
    requires spring.boot;
    requires spring.boot.autoconfigure;
    requires spring.web;
    requires spring.webmvc;
    requires spring.context;
    requires spring.core;
    requires spring.beans;
    
    // JSON processing
    requires com.fasterxml.jackson.core;
    requires com.fasterxml.jackson.databind;
    requires com.fasterxml.jackson.annotation;
    
    // HTTP client
    requires okhttp3;
    requires okhttp3.sse;
    
    // Logging
    requires org.slf4j;
    
    exports com.example.app;
    exports com.example.app.sse;
    
    // Allow Spring to access our classes
    opens com.example.app to spring.core;
    opens com.example.app.sse to spring.core, com.fasterxml.jackson.databind;
}