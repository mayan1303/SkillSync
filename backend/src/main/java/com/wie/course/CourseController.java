package com.wie.course;
import com.wie.ai.AiService;
import com.wie.dashboard.StudentInsights;
import com.wie.data.DataService;
import com.wie.exception.ApiException;
import com.wie.intelligence.IntelligenceService;
import com.wie.model.*;
import com.wie.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
/** Agency course CRUD, student catalog/enrolment and the personalised news feed. Role rules live in SecurityConfig (/api/agency, /api/student). */
@RestController @RequestMapping("/api")
public class CourseController {
  public record CourseReq(@NotBlank @Size(max = 80) String title, @NotBlank @Size(max = 40) String skill,
    @NotBlank @Pattern(regexp = "Beginner|Intermediate|Advanced") String level, @Min(1) @Max(104) int weeks,
    @NotBlank @Pattern(regexp = "Online|Offline|Hybrid") String mode, @Size(max = 600) String description) {}
  public record DraftReq(@NotBlank @Pattern(regexp = "^[A-Za-z0-9 +#./-]{2,40}$") String skill) {}
  private final CourseRepository courses; private final UserRepository users; private final StudentInsights ins; private final AiService ai; private final IntelligenceService intel; private final DataService data;
  public CourseController(CourseRepository c, UserRepository u, StudentInsights i, AiService a, IntelligenceService n, DataService d){ courses=c; users=u; ins=i; ai=a; intel=n; data=d; }

  @GetMapping("/agency/courses")
  public List<Map<String,Object>> mine(@AuthenticationPrincipal User u){
    List<User> st = users.findByRole(Role.STUDENT);
    return courses.findByAgencyIdOrderByCreatedAtDesc(u.id()).stream().map(c -> view(c, st, null)).toList(); }

  @PostMapping("/agency/courses") @ResponseStatus(HttpStatus.CREATED)
  public Map<String,Object> create(@AuthenticationPrincipal User u, @Valid @RequestBody CourseReq r){
    Course c = courses.save(new Course(null, u.id(), u.name(), r.title().trim(), r.skill().trim(), r.level(), r.weeks(), r.mode(),
      r.description() == null ? "" : r.description().trim(), Instant.now()));
    return view(c, users.findByRole(Role.STUDENT), null); }

  @DeleteMapping("/agency/courses/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@AuthenticationPrincipal User u, @PathVariable String id){
    Course c = courses.findById(id).filter(x -> x.agencyId().equals(u.id())).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Course not found"));
    courses.delete(c); }

  @PostMapping("/agency/courses/draft")
  public Map<String,String> draft(@AuthenticationPrincipal User u, @Valid @RequestBody DraftReq r){
    return Map.of("text", ai.chat("You write concise, honest course marketing copy.", List.of(Map.of("role", "user", "content",
      "Write a 2-sentence description and 4 short syllabus topics (comma separated) for a course on " + r.skill() + ". Plain text, under 80 words.")), 300)); }

  @GetMapping("/student/courses")
  public List<Map<String,Object>> catalog(@AuthenticationPrincipal User u){
    List<User> st = users.findByRole(Role.STUDENT);
    return courses.findAllByOrderByCreatedAtDesc().stream().map(c -> view(c, st, u))
      .sorted(Comparator.comparing((Map<String,Object> m) -> !((Boolean) m.get("recommended")))).toList(); }

  @PostMapping("/student/courses/{id}/enroll")
  public Map<String,Object> enroll(@AuthenticationPrincipal User u, @PathVariable String id){
    Course c = courses.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Course not found"));
    List<String> ids = enrolled(u); if (!ids.contains(id)) ids.add(id);
    Map<String,Object> p = new HashMap<>(u.profile() == null ? Map.of() : u.profile()); p.put("enrolledCourses", ids);
    User n = users.save(new User(u.id(), u.name(), u.email(), u.passwordHash(), u.role(), u.verified(), p, u.createdAt()));
    return view(c, users.findByRole(Role.STUDENT), n); }

  @GetMapping("/student/feed")
  public List<Map<String,Object>> feed(@AuthenticationPrincipal User u){
    Map<String,Integer> lv = ins.levels(ins.skillsOf(u)); List<Map<String,Object>> out = new ArrayList<>();
    for (Map<String,Object> s : data.topSkills(10)) { String name = (String) s.get("name");
      if (!has(lv, name)) out.add(item("ALERT", ((Number) s.get("pct")).doubleValue() >= 4 ? "WARNING" : "WATCH", name + " is in demand and missing from your profile",
        "Appears in " + s.get("pct") + "% of " + data.metaInt("analyticsClean") + " analytics job postings. Prove it with the Assessment or enroll in a course.", null)); }
    data.alerts().stream().limit(3).forEach(a -> out.add(item("MARKET", (String) a.get("severity"), (String) a.get("title"), (String) a.get("detail"), null)));
    courses.findAllByOrderByCreatedAtDesc().stream().limit(6).filter(c -> !has(lv, c.skill())).forEach(c ->
      out.add(item("COURSE", "INFO", "New course: " + c.title(), c.agencyName() + " · " + c.skill() + " · " + c.weeks() + " weeks · " + c.mode(), c.id())));
    if (out.isEmpty()) out.add(item("INFO", "INFO", "You're all caught up", "No new alerts for your skill set right now.", null));
    return out; }

  private Map<String,Object> view(Course c, List<User> st, User me){
    Map<String,Object> m = new LinkedHashMap<>();
    m.put("id", c.id()); m.put("title", c.title()); m.put("skill", c.skill()); m.put("level", c.level()); m.put("weeks", c.weeks()); m.put("mode", c.mode());
    m.put("description", c.description()); m.put("agency", c.agencyName()); m.put("enrolledCount", st.stream().filter(s -> enrolled(s).contains(c.id())).count());
    if (me != null) { m.put("enrolled", enrolled(me).contains(c.id())); m.put("recommended", !has(ins.levels(ins.skillsOf(me)), c.skill())); }
    return m; }
  private static Map<String,Object> item(String type, String sev, String title, String text, String courseId){
    Map<String,Object> m = new LinkedHashMap<>(); m.put("type", type); m.put("severity", sev); m.put("title", title); m.put("text", text); m.put("courseId", courseId); return m; }
  private static List<String> enrolled(User s){
    List<String> out = new ArrayList<>(); Object o = s.profile() == null ? null : s.profile().get("enrolledCourses");
    if (o instanceof List<?> l) for (Object x : l) out.add(String.valueOf(x)); return out; }
  private static boolean has(Map<String,Integer> lv, String skill){ return lv.entrySet().stream().anyMatch(e -> e.getKey().equalsIgnoreCase(skill) && e.getValue() >= 50); }
}
