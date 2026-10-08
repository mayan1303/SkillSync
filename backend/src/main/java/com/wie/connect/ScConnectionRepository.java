package com.wie.connect;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface ScConnectionRepository extends MongoRepository<ScConnection,String> {
  List<ScConnection> findByFromIdOrToId(String fromId, String toId);
}
