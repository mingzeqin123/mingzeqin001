package com.example.app;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class KeyChecker {
    private static final int MIN_LENGTH = 12;
    private static final int MIN_CHAR_CLASSES = 3;
    private static final int SEQUENTIAL_RUN = 4;
    private static final int REPEAT_RUN = 4;

    private static final Set<String> LEAKED_DICTIONARY = Set.of(
            "123456",
            "123456789",
            "111111",
            "abc123",
            "admin",
            "dragon",
            "iloveyou",
            "letmein",
            "monkey",
            "password",
            "password1",
            "passw0rd",
            "qwerty",
            "sunshine",
            "welcome"
    );

    private KeyChecker() {
    }

    public static List<Result> checkKeys(List<String> keys) {
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }

        Map<String, Integer> counts = new HashMap<>();
        for (String key : keys) {
            counts.merge(key, 1, Integer::sum);
        }

        List<Result> results = new ArrayList<>();
        for (String key : keys) {
            List<String> reasons = new ArrayList<>();
            boolean weak = evaluateWeakness(key, reasons);
            boolean leaked = isLeaked(key);
            if (leaked) {
                reasons.add("Leaked dictionary match");
            }

            Integer count = counts.getOrDefault(key, 0);
            boolean duplicate = count > 1;
            if (duplicate) {
                reasons.add("Duplicate key used " + count + " times");
            }

            results.add(new Result(key, weak, duplicate, leaked, reasons));
        }

        return List.copyOf(results);
    }

    public static String formatReport(List<Result> results) {
        StringBuilder report = new StringBuilder();
        report.append("Key check report").append(System.lineSeparator());

        if (results == null || results.isEmpty()) {
            report.append("No keys provided.");
            return report.toString();
        }

        int keysWithIssues = 0;
        for (int i = 0; i < results.size(); i++) {
            Result result = results.get(i);
            report.append('[').append(i + 1).append("] ")
                    .append(maskKey(result.getKey()))
                    .append(System.lineSeparator());

            if (result.getReasons().isEmpty()) {
                report.append("  OK").append(System.lineSeparator());
            } else {
                keysWithIssues++;
                for (String reason : result.getReasons()) {
                    report.append("  - ").append(reason).append(System.lineSeparator());
                }
            }
        }

        report.append("Summary: ")
                .append(results.size())
                .append(" keys checked, ")
                .append(keysWithIssues)
                .append(" with issues.");

        return report.toString();
    }

    public static void main(String[] args) {
        List<String> sampleKeys;
        if (args != null && args.length > 0) {
            sampleKeys = Arrays.asList(args);
        } else {
            sampleKeys = List.of(
                    "password",
                    "Short7",
                    "Qwerty1234",
                    "Unique-Key-2026",
                    "Unique-Key-2026",
                    "Adm1n!!",
                    "correct horse battery staple"
            );
        }

        List<Result> results = checkKeys(sampleKeys);
        System.out.println(formatReport(results));
    }

    private static boolean evaluateWeakness(String key, List<String> reasons) {
        String trimmed = key == null ? "" : key.trim();
        if (trimmed.isEmpty()) {
            reasons.add("Empty or blank key");
            return true;
        }

        if (trimmed.length() < MIN_LENGTH) {
            reasons.add("Length below " + MIN_LENGTH + " characters");
        }

        int classes = countCharClasses(trimmed);
        if (classes < MIN_CHAR_CLASSES) {
            reasons.add("Not enough character variety (need at least " + MIN_CHAR_CLASSES + " types)");
        }

        if (hasRepeatedRun(trimmed, REPEAT_RUN)) {
            reasons.add("Repeated character sequence detected");
        }

        if (hasSequentialRun(trimmed, SEQUENTIAL_RUN)) {
            reasons.add("Sequential character pattern detected");
        }

        return !reasons.isEmpty();
    }

    private static int countCharClasses(String value) {
        boolean lower = false;
        boolean upper = false;
        boolean digit = false;
        boolean symbol = false;

        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            if (Character.isLowerCase(current)) {
                lower = true;
            } else if (Character.isUpperCase(current)) {
                upper = true;
            } else if (Character.isDigit(current)) {
                digit = true;
            } else {
                symbol = true;
            }
        }

        int count = 0;
        if (lower) {
            count++;
        }
        if (upper) {
            count++;
        }
        if (digit) {
            count++;
        }
        if (symbol) {
            count++;
        }
        return count;
    }

    private static boolean hasRepeatedRun(String value, int runLength) {
        if (value.length() < runLength) {
            return false;
        }

        int run = 1;
        for (int i = 1; i < value.length(); i++) {
            if (value.charAt(i) == value.charAt(i - 1)) {
                run++;
                if (run >= runLength) {
                    return true;
                }
            } else {
                run = 1;
            }
        }

        return false;
    }

    private static boolean hasSequentialRun(String value, int runLength) {
        if (value.length() < runLength) {
            return false;
        }

        String normalized = value.toLowerCase(Locale.ROOT);
        int run = 1;
        int direction = 0;

        for (int i = 1; i < normalized.length(); i++) {
            char prev = normalized.charAt(i - 1);
            char curr = normalized.charAt(i);
            int delta = curr - prev;

            int newDirection = 0;
            if (delta == 1) {
                newDirection = 1;
            } else if (delta == -1) {
                newDirection = -1;
            }

            boolean sameClass = (Character.isDigit(prev) && Character.isDigit(curr))
                    || (Character.isLetter(prev) && Character.isLetter(curr));

            if (newDirection != 0 && sameClass) {
                if (direction == 0 || direction == newDirection) {
                    run++;
                    direction = newDirection;
                } else {
                    run = 2;
                    direction = newDirection;
                }
            } else {
                run = 1;
                direction = 0;
            }

            if (run >= runLength) {
                return true;
            }
        }

        return false;
    }

    private static boolean isLeaked(String key) {
        String normalized = normalizeForDictionary(key);
        if (normalized.isEmpty()) {
            return false;
        }

        if (LEAKED_DICTIONARY.contains(normalized)) {
            return true;
        }

        String lettersOnly = stripNonLetters(normalized);
        if (!lettersOnly.isEmpty() && LEAKED_DICTIONARY.contains(lettersOnly)) {
            return true;
        }

        String trimmedDigits = stripTrailingDigits(normalized);
        return !trimmedDigits.isEmpty() && LEAKED_DICTIONARY.contains(trimmedDigits);
    }

    private static String normalizeForDictionary(String key) {
        if (key == null) {
            return "";
        }

        String trimmed = key.trim().toLowerCase(Locale.ROOT);
        if (trimmed.isEmpty()) {
            return "";
        }

        StringBuilder normalized = new StringBuilder(trimmed.length());
        for (int i = 0; i < trimmed.length(); i++) {
            char current = trimmed.charAt(i);
            switch (current) {
                case '0':
                    normalized.append('o');
                    break;
                case '1':
                    normalized.append('l');
                    break;
                case '3':
                    normalized.append('e');
                    break;
                case '4':
                case '@':
                    normalized.append('a');
                    break;
                case '5':
                case '$':
                    normalized.append('s');
                    break;
                case '7':
                    normalized.append('t');
                    break;
                default:
                    normalized.append(current);
            }
        }

        return normalized.toString();
    }

    private static String stripNonLetters(String value) {
        StringBuilder lettersOnly = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            if (current >= 'a' && current <= 'z') {
                lettersOnly.append(current);
            }
        }
        return lettersOnly.toString();
    }

    private static String stripTrailingDigits(String value) {
        int end = value.length();
        while (end > 0 && Character.isDigit(value.charAt(end - 1))) {
            end--;
        }
        return value.substring(0, end);
    }

    private static String maskKey(String key) {
        if (key == null) {
            return "<null>";
        }

        String trimmed = key.trim();
        if (trimmed.isEmpty()) {
            return "<empty>";
        }

        int length = trimmed.length();
        if (length <= 4) {
            return "*".repeat(length);
        }

        int head = Math.min(2, length);
        int tail = Math.min(2, length - head);
        int maskLength = length - head - tail;

        return trimmed.substring(0, head)
                + "*".repeat(maskLength)
                + trimmed.substring(length - tail);
    }

    public static final class Result {
        private final String key;
        private final boolean weak;
        private final boolean duplicate;
        private final boolean leaked;
        private final List<String> reasons;

        public Result(String key, boolean weak, boolean duplicate, boolean leaked, List<String> reasons) {
            this.key = key;
            this.weak = weak;
            this.duplicate = duplicate;
            this.leaked = leaked;
            this.reasons = reasons == null ? List.of() : List.copyOf(reasons);
        }

        public String getKey() {
            return key;
        }

        public boolean isWeak() {
            return weak;
        }

        public boolean isDuplicate() {
            return duplicate;
        }

        public boolean isLeaked() {
            return leaked;
        }

        public List<String> getReasons() {
            return reasons;
        }

        public boolean hasIssues() {
            return weak || duplicate || leaked;
        }
    }
}
