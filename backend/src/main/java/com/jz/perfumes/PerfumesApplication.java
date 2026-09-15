package com.jz.perfumes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PerfumesApplication {

    public static void main(String[] args) {
        SpringApplication.run(PerfumesApplication.class, args);
    }
}
