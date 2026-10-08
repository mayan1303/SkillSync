package com.wie.connect;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface ScMessageRepository extends MongoRepository<ScMessage,String> {
  List<ScMessage> findByConvoKeyOrderByCreatedAtAsc(String convoKey);
  List<ScMessage> findByFromIdOrToIdOrderByCreatedAtDesc(String fromId, String toId);
}
