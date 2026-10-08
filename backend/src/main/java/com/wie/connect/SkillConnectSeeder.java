package com.wie.connect;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
/** Loads skill_connect_users.csv / skill_connect_requests.csv (resources/skillconnect) the first time the app starts. Runs only while sc_profiles is empty. */
@Component
public class SkillConnectSeeder implements CommandLineRunner {
  private final ScProfileRepository profiles; private final ScPostRepository posts;
  public SkillConnectSeeder(ScProfileRepository profiles, ScPostRepository posts){ this.profiles = profiles; this.posts = posts; }

  public void run(String... args) throws Exception {
    if (profiles.count() > 0) return;
    Map<String,ScProfile> byId = new LinkedHashMap<>();
    for (Map<String,String> r : csv("skillconnect/skill_connect_users.csv")) {
      ScProfile p = new ScProfile(); p.id = r.get("user_id"); p.name = r.get("name"); p.demo = true;
      if (p.id == null || p.id.isBlank() || p.name == null) continue;
      p.currentSkills = list(r.get("current_skills")); p.learningSkills = list(r.get("learning_skills")); p.canTeach = list(r.get("can_teach"));
      p.skillLevels = pairs(r.get("skill_levels")); p.careerGoal = r.getOrDefault("career_goal", ""); p.bio = r.getOrDefault("bio", "");
      p.privateChat = "1".equals(r.getOrDefault("private_chat", "0").trim()); p.publicReply = "1".equals(r.getOrDefault("public_reply", "0").trim());
      p.neuroticism = frac(r.get("neuroticism")); p.extraversion = frac(r.get("extraversion")); p.openness = frac(r.get("openness"));
      p.agreeableness = frac(r.get("agreeableness")); p.conscientiousness = frac(r.get("conscientiousness"));
      byId.put(p.id, p); }
    profiles.saveAll(byId.values());

    Instant t = Instant.now(); int n = 0; Set<String> withPost = new HashSet<>();
    for (Map<String,String> r : csv("skillconnect/skill_connect_requests.csv")) {          // the requests CSV becomes feed posts
      ScProfile a = byId.get(r.get("user_id")); String msg = r.getOrDefault("message", "").trim(); String skill = r.getOrDefault("skill", "").trim();
      if (a == null || msg.split("\\s+").length < 2) continue;                              // skip empty / one-word junk rows
      posts.save(post(a, "LEARN", skill, msg, "CLOSED".equalsIgnoreCase(r.get("status")) ? "CLOSED" : "OPEN", t.minus(++n * 5L, ChronoUnit.HOURS))); withPost.add(a.id); }
    for (ScProfile a : byId.values()) {                                                    // a first post for every member so the feed is alive
      if (!a.learningSkills.isEmpty() && !withPost.contains(a.id))
        posts.save(post(a, "LEARN", a.learningSkills.get(0), "Looking for someone to learn " + a.learningSkills.get(0) + " with. I can offer help with " + String.join(", ", a.canTeach.subList(0, Math.min(2, a.canTeach.size()))) + " in return.", "OPEN", t.minus(++n * 7L, ChronoUnit.HOURS)));
      if (!a.canTeach.isEmpty())
        posts.save(post(a, "TEACH", a.canTeach.get(0), "Happy to help anyone getting started with " + a.canTeach.get(0) + ". " + (a.bio == null ? "" : a.bio), "OPEN", t.minus(++n * 9L, ChronoUnit.HOURS))); }
  }

  private static ScPost post(ScProfile a, String type, String skill, String msg, String status, Instant at){
    ScPost p = new ScPost(); p.authorId = a.id; p.authorName = a.name; p.type = type; p.skill = skill; p.message = msg; p.status = status; p.createdAt = at; return p; }

  static double frac(String s){ try { double v = Double.parseDouble(s.trim()); return v > 1 ? Math.min(1, v / 100.0) : Math.max(0, v); } catch (Exception e) { return 0.5; } }
  static List<String> list(String s){ List<String> o = new ArrayList<>(); if (s != null) for (String x : s.split("[,;|\\n]")) if (!x.isBlank() && !o.contains(x.trim())) o.add(x.trim()); return o; }
  static List<String> pairs(String s){ List<String> o = new ArrayList<>(); if (s != null) for (String x : s.split("[,;]")) if (x.contains(":")) o.add(x.trim()); return o; }

  /** Minimal CSV reader: header row, quoted fields, commas and doubled quotes inside quotes. */
  static List<Map<String,String>> csv(String path) throws IOException {
    String text;
    try (InputStream in = new ClassPathResource(path).getInputStream()) { text = new String(in.readAllBytes(), StandardCharsets.UTF_8); }
    if (text.startsWith("\uFEFF")) text = text.substring(1);
    List<List<String>> rows = new ArrayList<>(); List<String> row = new ArrayList<>(); StringBuilder f = new StringBuilder(); boolean q = false;
    for (int i = 0; i < text.length(); i++) { char c = text.charAt(i);
      if (q) { if (c == '"') { if (i + 1 < text.length() && text.charAt(i + 1) == '"') { f.append('"'); i++; } else q = false; } else f.append(c); }
      else if (c == '"') q = true;
      else if (c == ',') { row.add(f.toString()); f.setLength(0); }
      else if (c == '\n' || c == '\r') { if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++; row.add(f.toString()); f.setLength(0); rows.add(row); row = new ArrayList<>(); }
      else f.append(c); }
    if (f.length() > 0 || !row.isEmpty()) { row.add(f.toString()); rows.add(row); }
    List<Map<String,String>> out = new ArrayList<>(); if (rows.isEmpty()) return out;
    List<String> head = rows.get(0);
    for (int r = 1; r < rows.size(); r++) { List<String> v = rows.get(r); if (v.size() == 1 && v.get(0).isBlank()) continue;
      Map<String,String> m = new HashMap<>(); for (int c = 0; c < head.size(); c++) m.put(head.get(c).trim(), c < v.size() ? v.get(c) : ""); out.add(m); }
    return out; }
}
