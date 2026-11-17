package com.example.catalogservice;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Skipped in unit testing mode: requires active PostgreSQL & Kafka services")
class CatalogServiceApplicationTests {

    @Test
    void contextLoads() {
    }

}
