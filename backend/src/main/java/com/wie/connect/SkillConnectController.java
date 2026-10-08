package com.wie.connect;
import com.wie.dashboard.StudentInsights;
import com.wie.data.DataService;
import com.wie.exception.ApiException;
import com.wie.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Skill Connect: profile, skill matching, feed, connections and 1:1 chat. STUDENT role only (SecurityConfig: /api/student/**). */
@RestController @RequestMapping("/api/student/connect")
public class SkillConnectController {
  public record SkillIn(@NotBlank @Size(max = 40) String name, @Min(1) @Max(5) int level) {}
  public record ProfileReq(@NotNull @Size(max = 30) List<@Valid SkillIn> current, @NotNull @Size(max = 30) List<@NotBlank @Size(max = 40) String> learning,
    @NotNull @Size(max = 30) List<@NotBlank @Size(max = 40) String> canTeach, @Size(max = 80) String careerGoal, @Size(max = 400) String bio,
    boolean privateChat, boolean publicReply, Map<String,Double> personality) {}
  public record PostReq(@NotBlank @Pattern(regexp = "LEARN|TEACH|UPDATE") String type, @Size(max = 40) String skill, @NotBlank @Size(max = 600) String message) {}
  public record TextReq(@NotBlank @Size(max = 1000) String text) {}
  public record ConnectReq(@NotBlank String toId) {}

  private final ScProfileRepository profiles; private final ScPostRepository posts; private final ScConnectionRepository conns; private final ScMessageRepository msgs;
  private final MatchEngine engine; private final StudentInsights ins; private final DataService data;
  public SkillConnectController(ScProfileRepository p, ScPostRepository po, ScConnectionRepository c, ScMessageRepository m, MatchEngine e, StudentInsights i, DataService d){
    profiles = p; posts = po; conns = c; msgs = m; engine = e; ins = i; data = d; }

  // ---------- helpers ----------
  private static ApiException err(HttpStatus s, String code, String msg){ return new ApiException(s, code, msg); }
  private ScProfile mine(User u){ return profiles.findById(u.id()).orElseThrow(() -> err(HttpStatus.CONFLICT, "NO_PROFILE", "Create your Skill Connect profile first")); }
  private ScProfile member(String id){ return profiles.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Member not found")); }
  private static List<String> clean(List<String> l){ LinkedHashMap<String,String> m = new LinkedHashMap<>(); if (l != null) for (String s : l) { String t = s == null ? "" : s.trim(); if (!t.isEmpty()) m.putIfAbsent(MatchEngine.norm(t), t); } return new ArrayList<>(m.values()); }
  private static String key(String a, String b){ return a.compareTo(b) < 0 ? a + "|" + b : b + "|" + a; }
  private static double frac(Map<String,Double> m, String k){ Double v = m == null ? null : m.get(k); return v == null ? 0.5 : Math.max(0, Math.min(100, v)) / 100.0; }
  private static long pct(double f){ return Math.round(f * 100); }

  private List<Map<String,Object>> skillViews(ScProfile p){
    Map<String,Double> lv = MatchEngine.levels(p.skillLevels); List<Map<String,Object>> o = new ArrayList<>();
    for (String s : p.currentSkills) o.add(Map.of("name", s, "level", lv.getOrDefault(MatchEngine.norm(s), 3.0).intValue()));
    return o; }

  private Map<String,Object> brief(ScProfile p){
    Map<String,Object> m = new LinkedHashMap<>();
    m.put("id", p.id); m.put("name", p.name); m.put("careerGoal", p.careerGoal == null ? "" : p.careerGoal); m.put("bio", p.bio == null ? "" : p.bio); m.put("demo", p.demo);
    m.put("privateChat", p.privateChat); m.put("publicReply", p.publicReply); m.put("currentSkills", skillViews(p)); m.put("learningSkills", p.learningSkills); m.put("canTeach", p.canTeach);
    return m; }

  private Map<String,Object> full(ScProfile p){
    Map<String,Object> m = brief(p);
    m.put("personality", Map.of("neuroticism", pct(p.neuroticism), "extraversion", pct(p.extraversion), "openness", pct(p.openness), "agreeableness", pct(p.agreeableness), "conscientiousness", pct(p.conscientiousness)));
    return m; }

  private Map<String,Object> matchView(MatchEngine.Result r){
    Map<String,Object> m = new LinkedHashMap<>();
    m.put("score", r.score()); m.put("skillScore", r.skillScore()); m.put("levelScore", r.levelScore()); m.put("careerScore", r.careerScore()); m.put("personalityScore", r.personalityScore());
    m.put("matched", r.matched()); m.put("missing", r.missing()); m.put("theyWant", r.theyWant()); m.put("mutual", r.mutual());
    return m; }

  /** NONE | PENDING_OUT | PENDING_IN | CONNECTED, plus the connection id when there is one. */
  private Map<String,Object> state(String me, String peer, List<ScConnection> all){
    Map<String,Object> m = new LinkedHashMap<>(); m.put("status", "NONE"); m.put("id", null);
    for (ScConnection c : all) {
      boolean out = c.fromId.equals(me) && c.toId.equals(peer), in = c.fromId.equals(peer) && c.toId.equals(me);
      if (!out && !in) continue;
      m.put("id", c.id); m.put("status", "ACCEPTED".equals(c.status) ? "CONNECTED" : out ? "PENDING_OUT" : "PENDING_IN"); break; }
    return m; }

  private boolean connected(String a, String b){
    return conns.findByFromIdOrToId(a, a).stream().anyMatch(c -> "ACCEPTED".equals(c.status) && (c.fromId.equals(b) || c.toId.equals(b))); }

  // ---------- profile ----------
  @GetMapping("/me")
  public Map<String,Object> me(@AuthenticationPrincipal User u){
    ScProfile p = profiles.findById(u.id()).orElse(null);
    Map<String,Object> out = new LinkedHashMap<>(); out.put("profile", p == null ? null : full(p));
    if (p == null) {   // pre-fill the onboarding form from the skills the student already has in the main app
      List<Map<String,Object>> cur = new ArrayList<>();
      for (var s : ins.skillsOf(u)) cur.add(Map.of("name", s.name(), "level", Math.max(1, Math.min(5, (int) Math.ceil(s.level() / 20.0)))));
      Map<String,Object> sg = new LinkedHashMap<>(); sg.put("name", u.name()); sg.put("currentSkills", cur); out.put("suggestion", sg); }
    return out; }

  @PutMapping("/me")
  public Map<String,Object> saveMe(@AuthenticationPrincipal User u, @Valid @RequestBody ProfileReq r){
    ScProfile p = profiles.findById(u.id()).orElseGet(ScProfile::new);
    p.id = u.id(); p.name = u.name(); p.demo = false;
    LinkedHashMap<String,SkillIn> cur = new LinkedHashMap<>(); for (SkillIn s : r.current()) cur.putIfAbsent(MatchEngine.norm(s.name()), new SkillIn(s.name().trim(), s.level()));
    p.currentSkills = cur.values().stream().map(SkillIn::name).collect(Collectors.toList());
    p.skillLevels = cur.values().stream().map(s -> s.name() + ":" + s.level()).collect(Collectors.toList());
    p.learningSkills = clean(r.learning()); p.canTeach = clean(r.canTeach());
    p.careerGoal = r.careerGoal() == null ? "" : r.careerGoal().trim(); p.bio = r.bio() == null ? "" : r.bio().trim();
    p.privateChat = r.privateChat(); p.publicReply = r.publicReply();
    p.neuroticism = frac(r.personality(), "neuroticism"); p.extraversion = frac(r.personality(), "extraversion"); p.openness = frac(r.personality(), "openness");
    p.agreeableness = frac(r.personality(), "agreeableness"); p.conscientiousness = frac(r.personality(), "conscientiousness");
    p.updatedAt = Instant.now();
    return full(profiles.save(p)); }

  @GetMapping("/skills")
  public Map<String,Object> skills(){
    List<String> market = data.topSkills(60).stream().map(s -> String.valueOf(s.get("name"))).collect(Collectors.toList());
    LinkedHashMap<String,String> community = new LinkedHashMap<>();
    for (ScProfile p : profiles.findAll()) for (List<String> l : List.of(p.currentSkills, p.learningSkills, p.canTeach)) for (String s : l) community.putIfAbsent(MatchEngine.norm(s), s);
    return Map.of("market", market, "community", new ArrayList<>(community.values())); }

  // ---------- matches ----------
  @GetMapping("/matches")
  public List<Map<String,Object>> matches(@AuthenticationPrincipal User u, @RequestParam(required = false) String skill){
    ScProfile me = mine(u); List<ScConnection> all = conns.findByFromIdOrToId(me.id, me.id);
    String want = MatchEngine.norm(skill); List<Map<String,Object>> out = new ArrayList<>();
    for (ScProfile p : profiles.findAll()) {
      if (p.id.equals(me.id)) continue;
      if (!want.isEmpty()) { Set<String> pool = MatchEngine.set(p.currentSkills); pool.addAll(MatchEngine.set(p.canTeach)); if (!pool.contains(want)) continue; }
      Map<String,Object> m = brief(p); m.put("match", matchView(engine.match(me, p))); m.put("connection", state(me.id, p.id, all)); out.add(m); }
    out.sort((a, b) -> {
      @SuppressWarnings("unchecked") Map<String,Object> x = (Map<String,Object>) a.get("match"), y = (Map<String,Object>) b.get("match");
      int c = Double.compare((Double) y.get("score"), (Double) x.get("score")); return c != 0 ? c : Boolean.compare((Boolean) y.get("mutual"), (Boolean) x.get("mutual")); });
    return out; }

  @GetMapping("/members/{id}")
  public Map<String,Object> memberDetail(@AuthenticationPrincipal User u, @PathVariable String id){
    ScProfile me = mine(u), p = member(id);
    Map<String,Object> m = full(p); m.put("match", matchView(engine.match(me, p))); m.put("connection", state(me.id, p.id, conns.findByFromIdOrToId(me.id, me.id)));
    m.put("posts", posts.findByAuthorIdOrderByCreatedAtDesc(p.id).stream().limit(5).map(x -> postView(x, me, new HashSet<>(), p)).collect(Collectors.toList()));
    return m; }

  // ---------- feed ----------
  private Map<String,Object> postView(ScPost x, ScProfile me, Set<String> relevantSkills, ScProfile author){
    Map<String,Object> m = new LinkedHashMap<>();
    m.put("id", x.id); m.put("authorId", x.authorId); m.put("authorName", x.authorName); m.put("authorDemo", author != null && author.demo);
    m.put("authorGoal", author == null ? "" : author.careerGoal); m.put("type", x.type); m.put("skill", x.skill == null ? "" : x.skill); m.put("message", x.message); m.put("status", x.status);
    m.put("createdAt", x.createdAt); m.put("likeCount", x.likes.size()); m.put("likedByMe", x.likes.contains(me.id)); m.put("mine", x.authorId.equals(me.id));
    m.put("canComment", x.authorId.equals(me.id) || author == null || author.publicReply);
    m.put("comments", x.comments.stream().map(c -> { Map<String,Object> cm = new LinkedHashMap<>(); cm.put("id", c.id); cm.put("authorId", c.authorId); cm.put("authorName", c.authorName); cm.put("text", c.text); cm.put("createdAt", c.createdAt); return cm; }).collect(Collectors.toList()));
    String sk = MatchEngine.norm(x.skill); String why = null;
    if (!x.authorId.equals(me.id) && !sk.isEmpty() && "OPEN".equals(x.status)) {
      Set<String> have = MatchEngine.set(me.currentSkills); have.addAll(MatchEngine.set(me.canTeach));
      if ("LEARN".equals(x.type) && have.contains(sk)) why = "You can help with " + x.skill;
      else if ("TEACH".equals(x.type) && MatchEngine.set(me.learningSkills).contains(sk)) why = "Matches what you want to learn"; }
    m.put("relevance", why);
    return m; }

  @GetMapping("/feed")
  public List<Map<String,Object>> feed(@AuthenticationPrincipal User u, @RequestParam(required = false) String type, @RequestParam(required = false) String skill,
                                       @RequestParam(defaultValue = "recent") String sort, @RequestParam(defaultValue = "false") boolean mineOnly){
    ScProfile me = mine(u); Map<String,ScProfile> byId = profiles.findAll().stream().collect(Collectors.toMap(p -> p.id, p -> p, (a, b) -> a));
    String want = MatchEngine.norm(skill); List<Map<String,Object>> out = new ArrayList<>();
    for (ScPost x : posts.findAllByOrderByCreatedAtDesc()) {
      if (type != null && !type.isBlank() && !"ALL".equals(type) && !type.equals(x.type)) continue;
      if (!want.isEmpty() && !MatchEngine.norm(x.skill).contains(want) && !MatchEngine.norm(x.message).contains(want)) continue;
      if (mineOnly && !x.authorId.equals(me.id)) continue;
      out.add(postView(x, me, null, byId.get(x.authorId))); }
    if ("relevant".equals(sort)) out.sort((a, b) -> Boolean.compare(b.get("relevance") != null, a.get("relevance") != null));  // stable: newest first inside each group
    return out; }

  @PostMapping("/posts")
  public Map<String,Object> createPost(@AuthenticationPrincipal User u, @Valid @RequestBody PostReq r){
    ScProfile me = mine(u); ScPost p = new ScPost(); p.authorId = me.id; p.authorName = me.name; p.type = r.type(); p.skill = r.skill() == null ? "" : r.skill().trim(); p.message = r.message().trim();
    return postView(posts.save(p), me, null, me); }

  @DeleteMapping("/posts/{id}")
  public Map<String,Object> deletePost(@AuthenticationPrincipal User u, @PathVariable String id){
    ScPost p = posts.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Post not found"));
    if (!p.authorId.equals(u.id())) throw err(HttpStatus.FORBIDDEN, "FORBIDDEN", "You can only delete your own posts");
    posts.delete(p); return Map.of("deleted", true); }

  @PostMapping("/posts/{id}/like")
  public Map<String,Object> like(@AuthenticationPrincipal User u, @PathVariable String id){
    ScPost p = posts.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Post not found"));
    if (!p.likes.remove(u.id())) p.likes.add(u.id()); posts.save(p);
    return Map.of("likeCount", p.likes.size(), "likedByMe", p.likes.contains(u.id())); }

  @PostMapping("/posts/{id}/status")
  public Map<String,Object> toggleStatus(@AuthenticationPrincipal User u, @PathVariable String id){
    ScPost p = posts.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Post not found"));
    if (!p.authorId.equals(u.id())) throw err(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the author can change this");
    p.status = "OPEN".equals(p.status) ? "CLOSED" : "OPEN"; posts.save(p); return Map.of("status", p.status); }

  @PostMapping("/posts/{id}/comments")
  public Map<String,Object> comment(@AuthenticationPrincipal User u, @PathVariable String id, @Valid @RequestBody TextReq r){
    ScProfile me = mine(u); ScPost p = posts.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Post not found"));
    ScProfile author = profiles.findById(p.authorId).orElse(null);
    if (!p.authorId.equals(me.id) && author != null && !author.publicReply) throw err(HttpStatus.FORBIDDEN, "REPLIES_OFF", author.name + " has turned off public replies");
    ScComment c = new ScComment(); c.id = UUID.randomUUID().toString(); c.authorId = me.id; c.authorName = me.name; c.text = r.text().trim();
    p.comments.add(c); posts.save(p); return postView(p, me, null, author); }

  // ---------- connections ----------
  private Map<String,Object> connRow(ScConnection c, ScProfile me){
    String peerId = c.fromId.equals(me.id) ? c.toId : c.fromId; ScProfile p = profiles.findById(peerId).orElse(null); if (p == null) return null;
    Map<String,Object> m = brief(p); m.put("connectionId", c.id); m.put("since", c.createdAt); m.put("score", engine.match(me, p).score()); return m; }

  @GetMapping("/connections")
  public Map<String,Object> connections(@AuthenticationPrincipal User u){
    ScProfile me = mine(u); List<Map<String,Object>> in = new ArrayList<>(), out = new ArrayList<>(), ok = new ArrayList<>();
    for (ScConnection c : conns.findByFromIdOrToId(me.id, me.id)) { Map<String,Object> row = connRow(c, me); if (row == null) continue;
      if ("ACCEPTED".equals(c.status)) ok.add(row); else if (c.toId.equals(me.id)) in.add(row); else out.add(row); }
    return Map.of("incoming", in, "outgoing", out, "connected", ok); }

  @PostMapping("/connections")
  public Map<String,Object> connect(@AuthenticationPrincipal User u, @Valid @RequestBody ConnectReq r){
    ScProfile me = mine(u), to = member(r.toId());
    if (to.id.equals(me.id)) throw err(HttpStatus.BAD_REQUEST, "SELF", "You cannot connect with yourself");
    List<ScConnection> all = conns.findByFromIdOrToId(me.id, me.id);
    for (ScConnection c : all) if ((c.fromId.equals(to.id) && c.toId.equals(me.id)) || (c.fromId.equals(me.id) && c.toId.equals(to.id))) {
      if (c.fromId.equals(to.id) && "PENDING".equals(c.status)) { c.status = "ACCEPTED"; conns.save(c); }   // they already asked you: this accepts
      return state(me.id, to.id, conns.findByFromIdOrToId(me.id, me.id)); }
    ScConnection c = new ScConnection(); c.fromId = me.id; c.toId = to.id; c.score = engine.match(me, to).score();
    if (to.demo) c.status = "ACCEPTED";                                                                       // demo members accept straight away
    conns.save(c); return state(me.id, to.id, conns.findByFromIdOrToId(me.id, me.id)); }

  @PostMapping("/connections/{id}/accept")
  public Map<String,Object> accept(@AuthenticationPrincipal User u, @PathVariable String id){
    ScConnection c = conns.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Request not found"));
    if (!c.toId.equals(u.id())) throw err(HttpStatus.FORBIDDEN, "FORBIDDEN", "Not your request");
    c.status = "ACCEPTED"; conns.save(c); return Map.of("status", "CONNECTED"); }

  /** Decline an incoming request, cancel one you sent, or remove a connection. */
  @DeleteMapping("/connections/{id}")
  public Map<String,Object> removeConnection(@AuthenticationPrincipal User u, @PathVariable String id){
    ScConnection c = conns.findById(id).orElseThrow(() -> err(HttpStatus.NOT_FOUND, "NOT_FOUND", "Connection not found"));
    if (!c.fromId.equals(u.id()) && !c.toId.equals(u.id())) throw err(HttpStatus.FORBIDDEN, "FORBIDDEN", "Not your connection");
    conns.delete(c); return Map.of("removed", true); }

  // ---------- chat ----------
  @GetMapping("/chats")
  public List<Map<String,Object>> chats(@AuthenticationPrincipal User u){
    ScProfile me = mine(u); Map<String,ScMessage> last = new HashMap<>(); Map<String,Integer> unread = new HashMap<>();
    for (ScMessage m : msgs.findByFromIdOrToIdOrderByCreatedAtDesc(me.id, me.id)) {
      String peer = m.fromId.equals(me.id) ? m.toId : m.fromId; last.putIfAbsent(peer, m);
      if (m.toId.equals(me.id) && !m.read) unread.merge(peer, 1, Integer::sum); }
    List<Map<String,Object>> out = new ArrayList<>();
    for (ScConnection c : conns.findByFromIdOrToId(me.id, me.id)) { if (!"ACCEPTED".equals(c.status)) continue;
      String peerId = c.fromId.equals(me.id) ? c.toId : c.fromId; ScProfile p = profiles.findById(peerId).orElse(null); if (p == null) continue;
      Map<String,Object> m = new LinkedHashMap<>(); m.put("peer", brief(p)); ScMessage lm = last.get(peerId);
      m.put("lastText", lm == null ? null : lm.text); m.put("lastAt", lm == null ? null : lm.createdAt); m.put("lastMine", lm != null && lm.fromId.equals(me.id)); m.put("unread", unread.getOrDefault(peerId, 0)); out.add(m); }
    out.sort((a, b) -> { Instant x = (Instant) a.get("lastAt"), y = (Instant) b.get("lastAt"); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return y.compareTo(x); });
    return out; }

  @GetMapping("/chats/{peerId}/messages")
  public List<Map<String,Object>> messages(@AuthenticationPrincipal User u, @PathVariable String peerId){
    ScProfile me = mine(u); member(peerId);
    if (!connected(me.id, peerId)) throw err(HttpStatus.FORBIDDEN, "NOT_CONNECTED", "Connect with this member to chat");
    List<ScMessage> list = msgs.findByConvoKeyOrderByCreatedAtAsc(key(me.id, peerId)); List<ScMessage> changed = new ArrayList<>();
    for (ScMessage m : list) if (m.toId.equals(me.id) && !m.read) { m.read = true; changed.add(m); }
    if (!changed.isEmpty()) msgs.saveAll(changed);
    return list.stream().map(m -> { Map<String,Object> o = new LinkedHashMap<>(); o.put("id", m.id); o.put("mine", m.fromId.equals(me.id)); o.put("text", m.text); o.put("createdAt", m.createdAt); return o; }).collect(Collectors.toList()); }

  @PostMapping("/chats/{peerId}/messages")
  public Map<String,Object> send(@AuthenticationPrincipal User u, @PathVariable String peerId, @Valid @RequestBody TextReq r){
    ScProfile me = mine(u), peer = member(peerId);
    if (!connected(me.id, peerId)) throw err(HttpStatus.FORBIDDEN, "NOT_CONNECTED", "Connect with this member to chat");
    if (!peer.privateChat) throw err(HttpStatus.FORBIDDEN, "CHAT_OFF", peer.name + " has turned off private messages");
    ScMessage m = new ScMessage(); m.convoKey = key(me.id, peerId); m.fromId = me.id; m.toId = peerId; m.text = r.text().trim(); m = msgs.save(m);
    if (peer.demo) { ScMessage a = new ScMessage(); a.convoKey = m.convoKey; a.fromId = peerId; a.toId = me.id; a.text = autoReply(peer, me, msgs.findByConvoKeyOrderByCreatedAtAsc(m.convoKey).size()); msgs.save(a); }
    Map<String,Object> o = new LinkedHashMap<>(); o.put("id", m.id); o.put("mine", true); o.put("text", m.text); o.put("createdAt", m.createdAt); return o; }

  /** Seeded demo members are not real people, so they answer with a short profile-based reply. */
  private String autoReply(ScProfile peer, ScProfile me, int count){
    String teach = String.join(", ", peer.canTeach.subList(0, Math.min(2, peer.canTeach.size()))), learn = peer.learningSkills.isEmpty() ? "new things" : peer.learningSkills.get(0);
    String[] later = { "Happy to help. What have you tried so far?", "Nice, send me an example of what you are working on and we can go through it.", "Sounds good! Want to set up a quick call this week?", "Great idea. I am also learning " + learn + ", so we could swap notes." };
    if (count <= 2) return "Hi " + me.name.split(" ")[0] + "! Thanks for reaching out. I can help with " + (teach.isEmpty() ? "a few things" : teach) + ", and I am currently learning " + learn + ". What would you like to start with?";
    return later[(count / 2) % later.length]; }

  @GetMapping("/badges")
  public Map<String,Object> badges(@AuthenticationPrincipal User u){
    long in = conns.findByFromIdOrToId(u.id(), u.id()).stream().filter(c -> "PENDING".equals(c.status) && c.toId.equals(u.id())).count();
    long unread = msgs.findByFromIdOrToIdOrderByCreatedAtDesc(u.id(), u.id()).stream().filter(m -> m.toId.equals(u.id()) && !m.read).count();
    return Map.of("incoming", in, "unread", unread); }
}
