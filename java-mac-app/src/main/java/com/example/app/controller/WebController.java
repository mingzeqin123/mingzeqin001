package com.example.app.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Web Controller for serving the main page
 */
@Controller
public class WebController {

    @GetMapping("/")
    public String index() {
        return "index";
    }
}