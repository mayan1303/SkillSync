package com.wie.assessment;
import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("assessments")
public record AssessmentSession(@Id String id, @Indexed String userId, String skill, List<String> questionIds,
                                int index, int correct, Instant issuedAt, String status) {}
