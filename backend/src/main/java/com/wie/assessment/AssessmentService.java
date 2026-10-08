package com.wie.assessment;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wie.ai.AiService;
import com.wie.assessment.QuestionBank.Q;
import com.wie.dashboard.StudentInsights;
import com.wie.exception.ApiException;
import com.wie.model.User;
import com.wie.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
@Service
public class AssessmentService {
  static final long LIMIT_MS = 12000, GRACE_MS = 1500;   // grace covers network latency only
  private final QuestionBank bank; private final AssessmentRepository repo; private final StudentInsights ins; private final UserRepository users;
  private final AiService ai; private final ObjectMapper mapper;
  private final Map<String,List<Q>> live = new ConcurrentHashMap<>();   // questions + accepted answers stay on the server
  public AssessmentService(QuestionBank b, AssessmentRepository r, StudentInsights i, UserRepository u, AiService ai, ObjectMapper m){ bank=b; repo=r; ins=i; users=u; this.ai=ai; mapper=m; }

  private String canonical(String s){ s = s.trim();
    for (String k : bank.skills()) if (k.equalsIgnoreCase(s)) return k;
    for (String k : StudentInsights.W.keySet()) if (k.equalsIgnoreCase(s)) return k;
    return s; }

  /** AI writes fresh questions for ANY skill. Without an AI key, only the built-in skills work. */
  private List<Q> generate(String skill){
    String raw = ai.chat("You write fast technical quiz questions. Output ONLY a JSON array, no prose, no code fences.",
      List.of(Map.of("role", "user", "content", "Write 8 short-answer questions testing practical knowledge of \"" + skill + "\": 3 easy (level 1), 3 medium (level 2), 2 hard (level 3). Each must be answerable by typing 1-4 words within 12 seconds, with an unambiguous answer that cannot be guessed from the question. "
        + "Format: [{\"q\":\"question\",\"level\":1,\"answers\":[\"accepted answer\",\"synonym\"]}] with 2-4 lowercase accepted answers each.")), 1400);
    try {
      raw = raw.substring(raw.indexOf('['), raw.lastIndexOf(']') + 1);
      List<Map<String,Object>> arr = mapper.readValue(raw, new TypeReference<>() {});
      List<Q> out = new ArrayList<>();
      for (Map<String,Object> m : arr) {
        List<String> a = ((List<?>) m.get("answers")).stream().map(x -> String.valueOf(x).toLowerCase().trim()).filter(s -> !s.isEmpty()).toList();
        if (a.isEmpty()) continue; int lv = m.get("level") instanceof Number n ? Math.max(1, Math.min(3, n.intValue())) : 2;
        out.add(new Q("ai" + out.size(), String.valueOf(m.get("q")), a, lv)); if (out.size() == 8) break; }
      if (out.size() < 5) throw new IllegalStateException();
      return out;
    } catch (Exception e) { throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_ERROR", "Could not generate questions. Please try again."); } }

  public Map<String,Object> start(User u, String rawSkill){
    String skill = canonical(rawSkill); List<Q> qs;
    repo.findFirstByUserIdAndSkillAndStatusOrderByIssuedAtDesc(u.id(), skill, "DONE").ifPresent(p -> {
      long left = 300 - Duration.between(p.issuedAt(), Instant.now()).toSeconds();
      if (left > 0) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "COOLDOWN", "You can retake " + skill + " in " + (left / 60 + 1) + " min."); });
    if (ai.configured()) {
      try { qs = generate(skill); }
      catch (ApiException e) { if (bank.questions(skill).isEmpty()) throw e; qs = new ArrayList<>(bank.questions(skill)); }
    } else { qs = new ArrayList<>(bank.questions(skill));
      if (qs.isEmpty()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_NOT_CONFIGURED", "Custom skills need AI. Set ANTHROPIC_API_KEY or GEMINI_API_KEY and restart the backend."); }
    qs.sort(Comparator.comparingInt(Q::w));
    AssessmentSession s = repo.save(new AssessmentSession(null, u.id(), skill, qs.stream().map(Q::id).toList(), 0, 0, Instant.now(), "ACTIVE"));
    live.put(s.id(), qs);
    return Map.of("sessionId", s.id(), "done", false, "index", 0, "total", qs.size(), "question", qs.get(0).text(), "timeLimitMs", LIMIT_MS); }

  public Map<String,Object> answer(User u, String id, String ans, boolean away){
    AssessmentSession s = repo.findById(id).filter(x -> x.userId().equals(u.id()))
      .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Assessment not found"));
    if (!"ACTIVE".equals(s.status())) throw new ApiException(HttpStatus.CONFLICT, "FINISHED", "Assessment already finished");
    List<Q> qs = live.get(id); if (qs == null) throw new ApiException(HttpStatus.CONFLICT, "EXPIRED", "Assessment expired. Please start again.");
    Q q = qs.get(s.index());
    boolean timedOut = Duration.between(s.issuedAt(), Instant.now()).toMillis() > LIMIT_MS + GRACE_MS;   // server clock decides
    boolean ok = !timedOut && !away && bank.matches(q, ans);
    int correct = s.correct() + (ok ? q.w() : 0), idx = s.index() + 1, total = qs.size(), totalW = qs.stream().mapToInt(Q::w).sum();
    if (idx >= total) {
      int level = Math.round(100f * correct / totalW); live.remove(id);
      repo.save(new AssessmentSession(s.id(), s.userId(), s.skill(), s.questionIds(), idx, correct, s.issuedAt(), "DONE"));
      updateSkill(u, s.skill(), level);
      return Map.of("done", true, "lastCorrect", ok, "timedOut", timedOut, "away", away, "correct", correct, "total", totalW, "level", level, "skill", s.skill()); }
    repo.save(new AssessmentSession(s.id(), s.userId(), s.skill(), s.questionIds(), idx, correct, Instant.now(), "ACTIVE"));
    return Map.of("done", false, "lastCorrect", ok, "timedOut", timedOut, "away", away, "index", idx, "total", total, "question", qs.get(idx).text(), "timeLimitMs", LIMIT_MS); }

  private void updateSkill(User u, String skill, int level){
    List<String> out = new ArrayList<>(); boolean found = false;
    for (StudentInsights.Skill k : ins.skillsOf(u)) {
      if (k.name().equals(skill)) { out.add(skill + ":" + level); found = true; } else out.add(k.name() + ":" + k.level()); }
    if (!found) out.add(skill + ":" + level);
    Map<String,Object> p = new HashMap<>(u.profile() == null ? Map.of() : u.profile()); p.put("skills", out);
    users.save(new User(u.id(), u.name(), u.email(), u.passwordHash(), u.role(), u.verified(), p, u.createdAt())); }
}
