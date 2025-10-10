package com.example.app;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.prefs.Preferences;

/**
 * Internationalization manager for handling localized messages
 * Supports dynamic locale switching and message formatting
 */
public class I18nManager {
    
    private static final String BUNDLE_NAME = "messages";
    private static final String LOCALE_PREF_KEY = "user.locale";
    
    private static I18nManager instance;
    private ResourceBundle resourceBundle;
    private Locale currentLocale;
    private Preferences preferences;
    
    private I18nManager() {
        preferences = Preferences.userNodeForPackage(I18nManager.class);
        loadLocale();
        loadResourceBundle();
    }
    
    public static I18nManager getInstance() {
        if (instance == null) {
            instance = new I18nManager();
        }
        return instance;
    }
    
    /**
     * Load the saved locale from preferences or use system default
     */
    private void loadLocale() {
        String savedLocale = preferences.get(LOCALE_PREF_KEY, null);
        if (savedLocale != null) {
            String[] parts = savedLocale.split("_");
            if (parts.length == 2) {
                currentLocale = new Locale(parts[0], parts[1]);
            } else {
                currentLocale = new Locale(parts[0]);
            }
        } else {
            // Use system default locale
            currentLocale = Locale.getDefault();
            // If system locale is not supported, fall back to English
            if (!isSupportedLocale(currentLocale)) {
                currentLocale = Locale.ENGLISH;
            }
        }
    }
    
    /**
     * Load the resource bundle for the current locale
     */
    private void loadResourceBundle() {
        try {
            resourceBundle = ResourceBundle.getBundle(BUNDLE_NAME, currentLocale);
        } catch (Exception e) {
            // Fallback to default locale if current locale is not available
            resourceBundle = ResourceBundle.getBundle(BUNDLE_NAME, Locale.ENGLISH);
        }
    }
    
    /**
     * Get a localized message by key
     * @param key the message key
     * @return the localized message
     */
    public String getMessage(String key) {
        try {
            return resourceBundle.getString(key);
        } catch (Exception e) {
            return "!" + key + "!"; // Return key with markers if not found
        }
    }
    
    /**
     * Get a localized message with parameters
     * @param key the message key
     * @param params the parameters to format into the message
     * @return the formatted localized message
     */
    public String getMessage(String key, Object... params) {
        try {
            String message = resourceBundle.getString(key);
            return MessageFormat.format(message, params);
        } catch (Exception e) {
            return "!" + key + "!"; // Return key with markers if not found
        }
    }
    
    /**
     * Change the current locale and reload the resource bundle
     * @param locale the new locale
     */
    public void setLocale(Locale locale) {
        if (!locale.equals(currentLocale)) {
            currentLocale = locale;
            loadResourceBundle();
            // Save the locale preference
            preferences.put(LOCALE_PREF_KEY, locale.toString());
        }
    }
    
    /**
     * Get the current locale
     * @return the current locale
     */
    public Locale getCurrentLocale() {
        return currentLocale;
    }
    
    /**
     * Get available supported locales
     * @return array of supported locales
     */
    public Locale[] getSupportedLocales() {
        return new Locale[] {
            Locale.ENGLISH,
            new Locale("en", "US"),
            new Locale("zh", "CN"),
            new Locale("ja", "JP")
        };
    }
    
    /**
     * Check if a locale is supported
     * @param locale the locale to check
     * @return true if supported, false otherwise
     */
    public boolean isSupportedLocale(Locale locale) {
        for (Locale supported : getSupportedLocales()) {
            if (supported.getLanguage().equals(locale.getLanguage())) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get display name for a locale in the current locale
     * @param locale the locale to get display name for
     * @return the display name
     */
    public String getLocaleDisplayName(Locale locale) {
        return locale.getDisplayName(currentLocale);
    }
}