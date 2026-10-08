package com.wie.connect;
import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
/** status: PENDING / ACCEPTED. A declined or cancelled request is simply deleted. */
@Document("sc_connections")
public class ScConnection {
  @Id public String id;
  @Indexed public String fromId, toId;
  public String status = "PENDING";
  public double score;
  public Instant createdAt = Instant.now();
}
