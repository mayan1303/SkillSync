package com.wie.repository;
import com.wie.model.RefreshToken;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface RefreshTokenRepository extends MongoRepository<RefreshToken,String> {
  Optional<RefreshToken> findByTokenHash(String hash);
  void deleteByUserId(String userId);
}
