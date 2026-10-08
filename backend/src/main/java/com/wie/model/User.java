package com.wie.model;
import java.time.Instant;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("users")
public record User(@Id String id, String name, @Indexed(unique = true) String email, String passwordHash,
                   @Indexed Role role, boolean verified, Map<String,Object> profile, Instant createdAt) {}
