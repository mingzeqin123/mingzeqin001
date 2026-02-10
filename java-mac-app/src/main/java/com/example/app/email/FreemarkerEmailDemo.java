package com.example.app.email;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;

import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class FreemarkerEmailDemo {
    private static final String TEMPLATE_PATH = "templates";
    private static final String SUBJECT_TEMPLATE = "email-subject.ftl";
    private static final String BODY_TEMPLATE = "email-body.ftl";

    private FreemarkerEmailDemo() {
    }

    public static void main(String[] args) throws Exception {
        Configuration configuration = new Configuration(Configuration.VERSION_2_3_34);
        configuration.setClassLoaderForTemplateLoading(
                FreemarkerEmailDemo.class.getClassLoader(),
                TEMPLATE_PATH
        );
        configuration.setDefaultEncoding(StandardCharsets.UTF_8.name());
        configuration.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
        configuration.setLogTemplateExceptions(false);
        configuration.setWrapUncheckedExceptions(true);

        Map<String, Object> model = buildSampleModel();
        Template subjectTemplate = configuration.getTemplate(SUBJECT_TEMPLATE);
        Template bodyTemplate = configuration.getTemplate(BODY_TEMPLATE);

        String subject = renderTemplate(subjectTemplate, model);
        String body = renderTemplate(bodyTemplate, model);

        System.out.println("Subject: " + subject);
        System.out.println("----");
        System.out.println(body);
    }

    private static Map<String, Object> buildSampleModel() {
        Map<String, Object> user = new HashMap<>();
        user.put("firstName", "Ada");
        user.put("fullName", "Ada Lovelace");
        user.put("email", "ada@example.com");

        Map<String, Object> shipping = new HashMap<>();
        shipping.put("address1", "123 Example Street");
        shipping.put("city", "London");
        shipping.put("region", "Greater London");
        shipping.put("postal", "SW1A 1AA");

        List<Map<String, Object>> items = new ArrayList<>();
        items.add(item("Mechanical Keyboard", 1, new BigDecimal("129.99")));
        items.add(item("Monitor Stand", 2, new BigDecimal("34.50")));
        items.add(item("USB-C Dock", 1, new BigDecimal("89.00")));

        BigDecimal total = items.stream()
                .map(item -> (BigDecimal) item.get("lineTotal"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> order = new HashMap<>();
        order.put("id", "ORD-2026-0210");
        order.put("date", LocalDate.now());
        order.put("items", items);
        order.put("total", total.setScale(2, RoundingMode.HALF_UP));
        order.put("shipping", shipping);

        Map<String, Object> model = new HashMap<>();
        model.put("user", user);
        model.put("order", order);
        model.put("supportEmail", "support@example.com");
        model.put("senderName", "Example Store");
        model.put("loginUrl", "https://example.com/login");
        model.put("generatedAt", LocalDate.now());
        return model;
    }

    private static Map<String, Object> item(String name, int quantity, BigDecimal unitPrice) {
        BigDecimal lineTotal = unitPrice
                .multiply(BigDecimal.valueOf(quantity))
                .setScale(2, RoundingMode.HALF_UP);
        Map<String, Object> item = new HashMap<>();
        item.put("name", name);
        item.put("quantity", quantity);
        item.put("unitPrice", unitPrice.setScale(2, RoundingMode.HALF_UP));
        item.put("lineTotal", lineTotal);
        return item;
    }

    private static String renderTemplate(Template template, Map<String, Object> model)
            throws IOException, TemplateException {
        StringWriter writer = new StringWriter();
        template.process(model, writer);
        return writer.toString();
    }
}
