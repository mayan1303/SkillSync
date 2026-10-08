package com.wie.connect;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
/** type: LEARN (I want to learn), TEACH (I can help with), UPDATE (general post). status: OPEN / CLOSED. */
@Document("sc_posts")
public class ScPost {
  @Id public String id;
  @Indexed public String authorId;
  public String authorName, type, skill, message, status = "OPEN";
  public List<String> likes = new ArrayList<>();
  public List<ScComment> comments = new ArrayList<>();
  @Indexed public Instant createdAt = Instant.now();
}
