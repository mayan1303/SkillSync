package com.wie.connect;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
/** One Skill Connect member. id = login user id for real users, or the CSV id (U001...) for seeded demo members. Personality values are stored as 0..1 fractions. */
@Document("sc_profiles")
public class ScProfile {
  @Id public String id;
  public String name, careerGoal, bio;
  public List<String> currentSkills = new ArrayList<>(), learningSkills = new ArrayList<>(), canTeach = new ArrayList<>(), skillLevels = new ArrayList<>();
  public boolean privateChat = true, publicReply = true, demo;
  public double neuroticism = 0.5, extraversion = 0.5, openness = 0.5, agreeableness = 0.5, conscientiousness = 0.5;
  public Instant updatedAt = Instant.now();
}
