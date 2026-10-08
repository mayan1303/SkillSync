package com.wie.security;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
/** Access token carries ONLY the user id. Role is always loaded from the DB per request. */
@Service
public class JwtService {
  private final SecretKey key; private final long accessMs;
  public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.access-ms}") long accessMs){
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.accessMs = accessMs; }
  public String generate(String userId){
    Date now = new Date();
    return Jwts.builder().subject(userId).issuedAt(now).expiration(new Date(now.getTime()+accessMs)).signWith(key).compact(); }
  public String parseSubject(String token){
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject(); }
}
