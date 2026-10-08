package com.wie.security;
import com.wie.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwt; private final UserRepository users;
  public JwtAuthFilter(JwtService jwt, UserRepository users){ this.jwt=jwt; this.users=users; }
  @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
    String h = req.getHeader("Authorization");
    if (h != null && h.startsWith("Bearer ")) {
      try {
        String id = jwt.parseSubject(h.substring(7));
        users.findById(id).ifPresent(u -> SecurityContextHolder.getContext().setAuthentication(
          new UsernamePasswordAuthenticationToken(u, null, List.of(new SimpleGrantedAuthority("ROLE_" + u.role())))));
      } catch (Exception e) { req.setAttribute("tokenInvalid", true); }
    }
    chain.doFilter(req, res);
  }
}
