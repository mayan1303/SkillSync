package com.wie.assessment;
import com.wie.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
/** /api/student/** is restricted to STUDENT in SecurityConfig. */
@RestController @RequestMapping("/api/student/assessments")
public class AssessmentController {
  public record StartReq(@NotBlank @Pattern(regexp = "^[A-Za-z0-9 +#./-]{2,40}$", message = "Skill name: 2-40 letters/numbers") String skill) {}
  public record AnswerReq(@NotNull @Size(max = 60) String answer, boolean away) {}
  private final AssessmentService svc; private final QuestionBank bank;
  public AssessmentController(AssessmentService s, QuestionBank b){ svc=s; bank=b; }
  @GetMapping("/skills") public Set<String> skills(){ return bank.skills(); }
  @PostMapping("/start") public Map<String,Object> start(@AuthenticationPrincipal User u, @Valid @RequestBody StartReq r){ return svc.start(u, r.skill()); }
  @PostMapping("/{id}/answer") public Map<String,Object> answer(@AuthenticationPrincipal User u, @PathVariable String id, @Valid @RequestBody AnswerReq r){ return svc.answer(u, id, r.answer(), r.away()); }
}
