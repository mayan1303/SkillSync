package com.wie.connect;
import java.util.*;
import org.springframework.stereotype.Component;
/**
 * Java port of the matching logic in bfb/chat.py (calculate_match).
 * Looks at what A wants to learn and checks it against what B knows / can teach:
 *   final = 0.45*skill + 0.20*level + 0.20*career + 0.15*personality
 * Differences from the Python file: single-letter skills such as "R" are kept, and personality values are
 * scaled to 0..1 (the CSV holds raw 0-100 scores, which the Python code compared as if they were 0..1).
 * Extra output (not part of the score): theyWant = skills B wants to learn that A can offer, for two-way swaps.
 */
@Component
public class MatchEngine {
  public record Result(double score, double skillScore, double levelScore, double careerScore, double personalityScore,
                       List<String> matched, List<String> missing, List<String> theyWant, boolean mutual) {}

  public static String norm(String s){
    if (s == null) return "";
    return s.toLowerCase().replace("&", "and").replaceAll("[^a-z0-9+#.\\- ]", " ").replaceAll("\\s+", " ").trim(); }

  static Set<String> set(List<String> l){
    Set<String> o = new LinkedHashSet<>();
    if (l != null) for (String s : l) { String n = norm(s); if (!n.isEmpty()) o.add(n); }
    return o; }

  public static Map<String,Double> levels(List<String> raw){
    Map<String,Double> m = new HashMap<>();
    if (raw == null) return m;
    for (String p : raw) { int i = p.lastIndexOf(':'); if (i <= 0) continue;
      double lv = 3; try { lv = Double.parseDouble(p.substring(i + 1).trim()); } catch (NumberFormatException e) {}
      m.put(norm(p.substring(0, i)), Math.max(1, Math.min(5, lv))); }
    return m; }

  static double round2(double v){ return Math.round(v * 100.0) / 100.0; }

  static double careerScore(String a, String b){
    String x = norm(a), y = norm(b);
    if (x.isEmpty() || y.isEmpty()) return 50;
    if (x.equals(y)) return 100;
    Set<String> w = new HashSet<>(Arrays.asList(x.split(" "))); w.retainAll(Arrays.asList(y.split(" ")));
    return w.isEmpty() ? 30 : 70; }

  static double personalityScore(ScProfile a, ScProfile b){
    double[] x = {a.neuroticism, a.extraversion, a.openness, a.agreeableness, a.conscientiousness};
    double[] y = {b.neuroticism, b.extraversion, b.openness, b.agreeableness, b.conscientiousness};
    double sum = 0; for (int i = 0; i < 5; i++) sum += Math.max(0, 1 - Math.abs(x[i] - y[i]));
    return sum / 5 * 100; }

  static void names(Map<String,String> disp, List<String> l){ if (l != null) for (String s : l) disp.putIfAbsent(norm(s), s); }

  public Result match(ScProfile a, ScProfile b){
    Set<String> desired = set(a.learningSkills);
    Set<String> pool = set(b.currentSkills); pool.addAll(set(b.canTeach));
    Map<String,String> disp = new HashMap<>(); names(disp, b.currentSkills); names(disp, b.canTeach); names(disp, a.learningSkills);
    List<String> matched = new ArrayList<>(), missing = new ArrayList<>();
    for (String s : desired) (pool.contains(s) ? matched : missing).add(disp.getOrDefault(s, s));
    double skill = desired.isEmpty() ? 0 : matched.size() * 100.0 / desired.size();

    Map<String,Double> lv = levels(b.skillLevels); double lsum = 0; int ln = 0;
    for (String s : desired) { Double v = lv.get(s); if (v != null) { lsum += Math.min(v / 5, 1); ln++; } }
    double level = desired.isEmpty() ? 50 : ln == 0 ? 30 : lsum / ln * 100;

    double career = careerScore(a.careerGoal, b.careerGoal), pers = personalityScore(a, b);
    double score = 0.45 * skill + 0.20 * level + 0.20 * career + 0.15 * pers;

    Set<String> aPool = set(a.currentSkills); aPool.addAll(set(a.canTeach));
    Map<String,String> d2 = new HashMap<>(); names(d2, a.currentSkills); names(d2, a.canTeach);
    List<String> theyWant = new ArrayList<>();
    for (String s : set(b.learningSkills)) if (aPool.contains(s)) theyWant.add(d2.getOrDefault(s, s));
    return new Result(round2(score), round2(skill), round2(level), round2(career), round2(pers), matched, missing, theyWant, !matched.isEmpty() && !theyWant.isEmpty()); }
}
