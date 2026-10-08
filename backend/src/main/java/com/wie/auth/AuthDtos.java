package com.wie.auth;
import com.wie.model.Role;
import com.wie.model.User;
import jakarta.validation.constraints.*;
import java.util.Map;
public final class AuthDtos {
  private AuthDtos(){}
  public record RegisterRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Size(max = 100) @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$", message = "Enter a valid email address") String email,
    @NotBlank @Size(min = 10, max = 72) @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", message = "Needs upper, lower case and a digit") String password,
    @NotNull Role role,
    Map<String,Object> profile) {}
  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
  public record UserDto(String id, String name, String email, Role role, boolean verified, Map<String,Object> profile) {
    public static UserDto of(User u){ return new UserDto(u.id(), u.name(), u.email(), u.role(), u.verified(), u.profile()); } }
  public record AuthResponse(String accessToken, UserDto user) {}
}
