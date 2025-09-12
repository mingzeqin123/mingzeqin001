package com.example.mongodb.model;

import org.bson.types.ObjectId;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户数据模型
 */
public class User {
    private ObjectId id;
    private String name;
    private String email;
    private int age;
    private String city;
    private String country;
    private LocalDateTime registrationDate;
    private List<String> interests;
    private double balance;
    
    // 构造函数
    public User() {}
    
    public User(String name, String email, int age, String city, String country, 
                List<String> interests, double balance) {
        this.name = name;
        this.email = email;
        this.age = age;
        this.city = city;
        this.country = country;
        this.interests = interests;
        this.balance = balance;
        this.registrationDate = LocalDateTime.now();
    }
    
    // Getter和Setter方法
    public ObjectId getId() {
        return id;
    }
    
    public void setId(ObjectId id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public int getAge() {
        return age;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public LocalDateTime getRegistrationDate() {
        return registrationDate;
    }
    
    public void setRegistrationDate(LocalDateTime registrationDate) {
        this.registrationDate = registrationDate;
    }
    
    public List<String> getInterests() {
        return interests;
    }
    
    public void setInterests(List<String> interests) {
        this.interests = interests;
    }
    
    public double getBalance() {
        return balance;
    }
    
    public void setBalance(double balance) {
        this.balance = balance;
    }
    
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", age=" + age +
                ", city='" + city + '\'' +
                ", country='" + country + '\'' +
                ", registrationDate=" + registrationDate +
                ", interests=" + interests +
                ", balance=" + balance +
                '}';
    }
}