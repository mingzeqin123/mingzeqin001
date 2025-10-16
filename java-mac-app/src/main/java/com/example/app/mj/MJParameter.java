package com.example.app.mj;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Represents a Midjourney parameter with its value and metadata
 */
public class MJParameter {
    private String name;
    private String value;
    private String description;
    private boolean required;
    private String category;
    private List<String> validValues;
    private String defaultValue;

    public MJParameter() {
        this.validValues = new ArrayList<>();
    }

    public MJParameter(String name, String value, String description, boolean required, String category) {
        this();
        this.name = name;
        this.value = value;
        this.description = description;
        this.required = required;
        this.category = category;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getValidValues() {
        return validValues;
    }

    public void setValidValues(List<String> validValues) {
        this.validValues = validValues;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public boolean isValid() {
        if (required && (value == null || value.trim().isEmpty())) {
            return false;
        }
        if (!validValues.isEmpty() && value != null && !validValues.contains(value)) {
            return false;
        }
        return true;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MJParameter that = (MJParameter) o;
        return Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }

    @Override
    public String toString() {
        return "MJParameter{" +
                "name='" + name + '\'' +
                ", value='" + value + '\'' +
                ", description='" + description + '\'' +
                ", required=" + required +
                ", category='" + category + '\'' +
                '}';
    }
}