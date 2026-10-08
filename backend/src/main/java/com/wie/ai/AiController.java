package com.wie.ai;
import com.wie.course.CourseRepository;
import com.wie.dashboard.StudentInsights;
import com.wie.data.DataService;
import com.wie.exception.ApiException;
import com.wie.intelligence.IntelligenceService;
import com.wie.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/ai")
public class AiController {
  public record Msg(@NotBlank @Pattern(regexp = "user|assistant") String role, @NotBlank @Size(max = 1000) String content) {}
  public record ChatReq(@NotNull @Size(min = 1, max = 12) List<@Valid Msg> messages) {}
  private final AiService ai; private final CustomBotClient bot; private final StudentInsights ins; private final IntelligenceService intel; private final CourseRepository courses; private final DataService data;
  private final Map<String,Deque<Long>> hits = new ConcurrentHashMap<>();
  public AiController(AiService ai, CustomBotClient bot, StudentInsights ins, IntelligenceService intel, CourseRepository courses, DataService data){
    this.ai=ai; this.bot=bot; this.ins=ins; this.intel=intel; this.courses=courses; this.data=data; }

  /** Order: your custom model (if CUSTOM_BOT_URL) -> Claude/Gemini -> built-in data answers. Every path is grounded in the dataset facts. */
  @PostMapping("/chat")
  public Map<String,String> chat(@AuthenticationPrincipal User u, @Valid @RequestBody ChatReq r){
    limit(u.id());
    List<Map<String,String>> msgs = r.messages().stream().map(m -> Map.of("role", m.role(), "content", m.content())).toList();
    String q = r.messages().get(r.messages().size() - 1).content(), system = system(u, q), reply = null, source = "custom-model";
    if (bot.configured()) reply = bot.ask(q, msgs, system, u.role().name());
    if (reply == null && ai.configured()) { source = "llm"; reply = ai.chat(system, msgs, 500); }
    if (reply == null) { source = "data"; reply = data.fallbackAnswer(q); }
    return Map.of("reply", reply, "source", source); }

  @PostMapping("/insight")
  public Map<String,String> insight(@AuthenticationPrincipal User u){
    if (!ai.configured()) return Map.of("insight", data.alerts().stream().limit(3).map(a -> "• " + a.get("title") + ": " + a.get("detail")).collect(Collectors.joining("\n")));
    limit(u.id());
    return Map.of("insight", ai.chat(system(u, "overview"), List.of(Map.of("role", "user", "content",
      "Give exactly 3 short bullet insights (one line each, each starting with '• ') for my dashboard right now: one strength, one risk, one action for this week. Use the data facts.")), 300)); }

  private String guide(User u){
    String cat = courses.findAllByOrderByCreatedAtDesc().stream().limit(8).map(c -> c.title() + " (" + c.skill() + ", " + c.agencyName() + ")").reduce((a, b) -> a + "; " + b).orElse("none yet");
    String pages = switch (u.role()) {
      case STUDENT -> "App pages: Dashboard, Market (job-market charts), Skill Lab (predicts salary-hike chance from 5 skill scores), News Feed, Courses (catalog + enroll), Assessment (AI quiz on ANY skill, 12 s per answer), What-If, Simulator, Alerts, Outcomes. ";
      case RECRUITER -> "App pages: Dashboard, Market, Talent Screener (predicts junior salary-hike chance and senior success from traits), Simulator, Alerts, Outcomes. ";
      case COURSE_AGENCY -> "App pages: Dashboard, Market, Skill Lab, My Courses (create courses; AI can draft the description), Simulator, Alerts, Outcomes. "; };
    return pages + "Tell the user which page to open when useful. Courses on the platform: " + cat + ".\n"; }

  private String system(User u, String q){
    String base = "You are the AI coach inside Workforce Intelligence, a platform built on a data-science jobs and skills study (analytics job postings, junior skill traits, senior personality traits). Rules: "
      + "1) For questions about jobs, skills, salaries, locations, companies, traits or hiring, answer ONLY from the DATA FACTS below and quote the numbers; if the facts do not contain it, say so. "
      + "2) For anything else (careers, learning plans, interview prep, general knowledge) answer helpfully from general knowledge. "
      + "3) Be concise (under 150 words) and practical. Never invent statistics.\n" + guide(u);
    String who = switch (u.role()) {
      case STUDENT -> { Map<String,Object> d = ins.dashboard(u, intel); yield "User is a student named " + u.name() + ". Readiness " + d.get("futureReadiness") + "%. Skills: " + d.get("skills") + ". Biggest gaps: " + d.get("missingSkills") + ".\n"; }
      case RECRUITER -> "User is a recruiter at " + u.profile().get("company") + ".\n";
      case COURSE_AGENCY -> "User runs the training agency " + u.name() + ".\n"; };
    return base + who + "DATA FACTS:\n" + data.digest() + "\n" + data.retrieve(q); }

  private void limit(String id){
    Deque<Long> q = hits.computeIfAbsent(id, k -> new ArrayDeque<>()); long now = System.currentTimeMillis();
    synchronized (q) { while (!q.isEmpty() && now - q.peekFirst() > 60000) q.pollFirst();
      if (q.size() >= 15) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT", "Slow down a little and try again in a minute.");
      q.addLast(now); } }
}
