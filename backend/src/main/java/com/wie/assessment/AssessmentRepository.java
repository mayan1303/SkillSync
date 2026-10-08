package com.wie.assessment;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface AssessmentRepository extends MongoRepository<AssessmentSession,String> {
  java.util.Optional<AssessmentSession> findFirstByUserIdAndSkillAndStatusOrderByIssuedAtDesc(String userId, String skill, String status);
}
