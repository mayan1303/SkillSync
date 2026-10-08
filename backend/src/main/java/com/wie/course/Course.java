package com.wie.course;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("courses")
public record Course(@Id String id, @Indexed String agencyId, String agencyName, String title, @Indexed String skill,
                     String level, int weeks, String mode, String description, Instant createdAt) {}
