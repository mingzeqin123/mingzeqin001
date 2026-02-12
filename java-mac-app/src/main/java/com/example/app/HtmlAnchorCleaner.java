package com.example.app;

import java.util.regex.Pattern;

/**
 * HTML anchor tag cleaner.
 * Removes only opening/closing a-tags while keeping their inner content.
 */
public final class HtmlAnchorCleaner {
    private static final Pattern A_TAG_PATTERN = Pattern.compile("(?i)</?a\\b[^>]*>");

    private HtmlAnchorCleaner() {
        // Utility class
    }

    public static String removeAnchorTags(String html) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        return A_TAG_PATTERN.matcher(html).replaceAll("");
    }
}
