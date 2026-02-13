package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.example.demo")
@EnableScheduling
public class NeurofleetApplication {

    public static void main(String[] args) {
        SpringApplication.run(NeurofleetApplication.class, args);
    }
}

