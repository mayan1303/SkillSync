package com.wie.connect;
import java.time.Instant;
public class ScComment {
  public String id, authorId, authorName, text;
  public Instant createdAt = Instant.now();
}
