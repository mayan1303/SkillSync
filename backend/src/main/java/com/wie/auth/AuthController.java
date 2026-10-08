package com.wie.auth;
import com.wie.auth.AuthDtos.*;
import com.wie.model.User;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth")
public class AuthController {
  private final AuthService svc;
  public AuthController(AuthService svc){ this.svc=svc; }
  @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
  public AuthResponse register(@Valid @RequestBody RegisterRequest r, HttpServletResponse res){ return svc.register(r,res); }
  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest r, HttpServletResponse res){ return svc.login(r,res); }
  @PostMapping("/refresh")
  public AuthResponse refresh(@CookieValue(name = AuthService.COOKIE, required = false) String t, HttpServletResponse res){ return svc.refresh(t,res); }
  @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void logout(@CookieValue(name = AuthService.COOKIE, required = false) String t, HttpServletResponse res){ svc.logout(t,res); }
  @GetMapping("/me")
  public UserDto me(@AuthenticationPrincipal User u){ return UserDto.of(u); }
}
