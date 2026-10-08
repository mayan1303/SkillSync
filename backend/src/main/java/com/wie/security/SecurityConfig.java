package com.wie.security;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
@Configuration @EnableWebSecurity
public class SecurityConfig {
  @Bean PasswordEncoder encoder(){ return new BCryptPasswordEncoder(12); }

  @Bean SecurityFilterChain chain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
    http.csrf(c -> c.disable())   // stateless bearer API; refresh cookie is SameSite=Strict + path-scoped
        .cors(c -> {})
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
          .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout", "/api/health").permitAll()
          .requestMatchers("/api/student/**").hasRole("STUDENT")
          .requestMatchers("/api/recruiter/**").hasRole("RECRUITER")
          .requestMatchers("/api/agency/**").hasRole("COURSE_AGENCY")
          .anyRequest().authenticated())
        .exceptionHandling(e -> e
          .authenticationEntryPoint((rq, rs, ex) -> {
            rs.setStatus(401); rs.setContentType("application/json");
            String code = rq.getAttribute("tokenInvalid") != null ? "SESSION_EXPIRED" : "UNAUTHORIZED";
            rs.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"Please log in again\"}"); })
          .accessDeniedHandler((rq, rs, ex) -> {
            rs.setStatus(403); rs.setContentType("application/json");
            rs.getWriter().write("{\"code\":\"FORBIDDEN\",\"message\":\"You do not have access to this resource\"}"); }))
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.cors-origin}") String origin){
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOrigins(List.of(origin.split(",")));
    c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    c.setAllowedHeaders(List.of("Authorization","Content-Type"));
    c.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/api/**", c);
    return s;
  }
}
