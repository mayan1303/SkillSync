package com.wie.connect;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface ScPostRepository extends MongoRepository<ScPost,String> {
  List<ScPost> findAllByOrderByCreatedAtDesc();
  List<ScPost> findByAuthorIdOrderByCreatedAtDesc(String authorId);
}
