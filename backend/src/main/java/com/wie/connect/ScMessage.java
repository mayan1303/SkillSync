package com.wie.connect;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
@Document("sc_messages")
public class ScMessage {
  @Id public String id;
  @Indexed public String convoKey, fromId, toId;
  public String text;
  public boolean read;
  public Instant createdAt = Instant.now();
}
