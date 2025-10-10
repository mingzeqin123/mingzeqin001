# Java i18n Implementation Guide

## Overview

This document describes the internationalization (i18n) implementation for the Mac Java Application. The solution addresses the following issues that were present in the original code:

### Issues Resolved

1. **Hardcoded Strings**: All UI text was hardcoded in Chinese directly in the Java code
2. **No Locale Support**: No mechanism to switch between different languages
3. **Missing Resource Files**: No property files for different locales
4. **Tight Coupling**: Business logic and UI text were tightly coupled

## Solution Architecture

### 1. I18nManager Class

A singleton class that manages internationalization:

- **Location**: `src/main/java/com/example/app/I18nManager.java`
- **Features**:
  - Singleton pattern for global access
  - Dynamic locale switching
  - Message parameter formatting using `MessageFormat`
  - Locale preference persistence using Java Preferences API
  - Fallback to English if requested locale is unavailable

### 2. Resource Bundle Files

Property files containing localized messages:

- `src/main/resources/messages.properties` - Default (English)
- `src/main/resources/messages_en_US.properties` - English (US)
- `src/main/resources/messages_zh_CN.properties` - Chinese (Simplified)
- `src/main/resources/messages_ja_JP.properties` - Japanese

### 3. Application Integration

The main application (`MacJavaApp.java`) was refactored to:

- Use `I18nManager` for all text retrieval
- Include a language menu for runtime locale switching
- Dynamically update UI when locale changes
- Separate UI components for easier text updates

## Supported Languages

| Locale | Language | File |
|--------|----------|------|
| `en` | English | `messages.properties` |
| `en_US` | English (US) | `messages_en_US.properties` |
| `zh_CN` | Chinese (Simplified) | `messages_zh_CN.properties` |
| `ja_JP` | Japanese | `messages_ja_JP.properties` |

## Key Features

### 1. Dynamic Language Switching

Users can change the application language at runtime through the "Language / 语言" menu. The change is immediate and persists across application restarts.

### 2. Message Parameterization

Support for parameterized messages using `MessageFormat`:

```java
// In properties file:
file.selected=Selected file: {0}
file.size=File size: {0} bytes

// In Java code:
i18n.getMessage("file.selected", fileName);
i18n.getMessage("file.size", fileSize);
```

### 3. Fallback Mechanism

- If a message key is not found, returns the key with markers: `!key.name!`
- If a locale is not supported, falls back to English
- If English is not available, uses the default resource bundle

### 4. Preference Persistence

User's language preference is saved using Java Preferences API and restored on application startup.

## Usage Examples

### Basic Message Retrieval

```java
I18nManager i18n = I18nManager.getInstance();
String title = i18n.getMessage("app.title");
```

### Parameterized Messages

```java
String message = i18n.getMessage("system.os", System.getProperty("os.name"));
```

### Locale Management

```java
// Change locale
i18n.setLocale(new Locale("zh", "CN"));

// Get current locale
Locale current = i18n.getCurrentLocale();

// Get supported locales
Locale[] supported = i18n.getSupportedLocales();
```

## Message Key Structure

Messages are organized hierarchically:

- `app.*` - Application-level messages (title, welcome, description)
- `button.*` - Button labels
- `status.*` - Status messages
- `greeting.*` - Greeting dialog messages
- `file.*` - File-related messages
- `system.*` - System information messages

## Testing

A test class `I18nTest.java` is provided to verify the i18n functionality:

```bash
# Compile (without JavaFX dependencies)
javac -cp "src/main/resources" -d . src/main/java/com/example/app/I18nManager.java src/main/java/com/example/app/I18nTest.java

# Run test
java -cp ".:src/main/resources" com.example.app.I18nTest
```

## Adding New Languages

To add support for a new language:

1. Create a new properties file: `messages_[language]_[COUNTRY].properties`
2. Translate all message keys from the default `messages.properties`
3. Add the new locale to `I18nManager.getSupportedLocales()`
4. Test the new locale using the test class

Example for French (France):

```properties
# messages_fr_FR.properties
app.title=Application Java Mac v1.0
app.welcome=Bienvenue dans l'application Java Mac
# ... etc
```

```java
// In I18nManager.getSupportedLocales()
return new Locale[] {
    Locale.ENGLISH,
    new Locale("en", "US"),
    new Locale("zh", "CN"),
    new Locale("ja", "JP"),
    new Locale("fr", "FR")  // Add this line
};
```

## Best Practices

1. **Consistent Key Naming**: Use hierarchical dot notation for message keys
2. **Parameter Ordering**: Keep parameter order consistent across languages
3. **Context Information**: Include context in key names (e.g., `button.save` vs `menu.save`)
4. **Fallback Messages**: Always provide default English messages
5. **Testing**: Test all supported locales before deployment

## Performance Considerations

- Resource bundles are cached by the JVM
- Locale switching reloads the resource bundle but is generally fast
- Message formatting is done on-demand, suitable for desktop applications
- Preferences are stored locally and persist across sessions

## Troubleshooting

### Common Issues

1. **Missing Properties File**: Ensure all property files are in `src/main/resources`
2. **Encoding Issues**: Use UTF-8 encoding for all property files
3. **Missing Keys**: Check the console for `!key.name!` patterns indicating missing translations
4. **Parameter Mismatch**: Ensure parameter counts match between locales

### Debug Mode

Enable debug logging by adding system property:
```bash
java -Djava.util.logging.level=INFO YourApp
```

This implementation provides a robust, scalable internationalization solution that can be easily extended to support additional languages and enhanced with more sophisticated features as needed.