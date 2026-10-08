package com.wie.data;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wie.exception.ApiException;
import java.io.IOException;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
/** Serves the cleaned SAS-hackathon data (insights.json, built by data-prep/build_data.py) and the two trained logistic models. */
@Service
@SuppressWarnings("unchecked")
public class DataService {
  private final Map<String,Object> d;
  public DataService(ObjectMapper m) throws IOException {
    d = m.readValue(new ClassPathResource("data/insights.json").getInputStream(), new TypeReference<Map<String,Object>>() {}); }
  public Map<String,Object> insights(){ return d; }
  private List<Map<String,Object>> list(String k){ return (List<Map<String,Object>>) d.get(k); }
  private Map<String,Object> map(String k){ return (Map<String,Object>) d.get(k); }
  public int metaInt(String k){ return ((Number) map("meta").get(k)).intValue(); }
  public List<Map<String,Object>> topSkills(int n){ return list("topSkills").stream().limit(n).toList(); }
  public List<Map<String,Object>> alerts(){ return list("alerts"); }
  public List<Map<String,Object>> categories(){ return list("categories"); }
  public String digest(){ return (String) d.get("digest"); }
  public String callout(String role){ return (String) map("callouts").get(role); }

  private static boolean word(String text, String w){ return Pattern.compile("\\b" + Pattern.quote(w) + "\\b").matcher(text).find(); }
  private static final String[][] RULES = {
    {"skills", "skill|learn|demand|tool|technolog|language"}, {"locations", "location|city|cities|where|hub"}, {"salary", "salary|pay|ctc|lpa|lakh|earn"},
    {"companies", "compan|hiring|recruit|employer"}, {"roles", "role|designation|title|job"}, {"experience", "experience|fresher|years"},
    {"junior", "junior|hike|promotion|dashboard|storytell|coding|maths|stats|big data|ai and ml|skill score"},
    {"senior", "senior|personality|trait|neurotic|extravers|openness|agreeab|conscientious|success"}};
  /** Pulls the facts relevant to a question so the bot can answer from the data. */
  public String retrieve(String q){
    String l = q.toLowerCase(); StringBuilder sb = new StringBuilder(); Map<String,Object> f = map("facts");
    for (Map<String,Object> s : list("topSkills")) if (word(l, ((String) s.get("name")).toLowerCase())) sb.append(s.get("name")).append(" appears in ").append(s.get("count")).append(" postings (").append(s.get("pct")).append("%). ");
    for (Map<String,Object> s : list("locations")) if (word(l, ((String) s.get("name")).toLowerCase())) sb.append(s.get("name")).append(" has ").append(s.get("count")).append(" postings (").append(s.get("pct")).append("%). ");
    for (String[] r : RULES) if (Pattern.compile(r[1]).matcher(l).find()) sb.append(f.get(r[0])).append(' ');
    return sb.length() > 1800 ? sb.substring(0, 1800) : sb.toString(); }
  /** Used when no LLM key and no custom model is configured. */
  public String fallbackAnswer(String q){
    String r = retrieve(q);
    return r.isBlank() ? "I can answer questions about the job-market data: skills, salaries, locations, companies, junior skill scores and senior personality traits. Try: \"Which skills are most in demand?\" (Add an AI key to unlock general questions too.)" : r; }

  private static double sig(double z){ return 1 / (1 + Math.exp(-z)); }
  private static double r3(double v){ return Math.round(v * 1000) / 1000.0; }
  /** model = junior (5 skill scores, 1-5) or senior (5 personality traits, normalized). Returns probability of the high outcome, per-feature drivers and the best single lever. */
  public Map<String,Object> predict(String model, Map<String,Double> x){
    if (!model.equals("junior") && !model.equals("senior")) throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Unknown model");
    Map<String,Object> m = map(model); List<Map<String,Object>> fs = (List<Map<String,Object>>) m.get("features");
    double lo = ((Number) m.get("min")).doubleValue(), hi = ((Number) m.get("max")).doubleValue(), z = ((Number) m.get("intercept")).doubleValue(), step = model.equals("junior") ? 1 : 10;
    List<Map<String,Object>> drivers = new ArrayList<>(); double[] c = new double[fs.size()], v = new double[fs.size()];
    for (int i = 0; i < fs.size(); i++) { Map<String,Object> f = fs.get(i); String k = (String) f.get("key"); Double val = x.get(k);
      if (val == null || val.isNaN() || val < lo || val > hi) throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", f.get("label") + " must be between " + lo + " and " + hi);
      c[i] = ((Number) f.get("coef")).doubleValue(); v[i] = val; z += c[i] * val;
      drivers.add(Map.of("key", k, "label", f.get("label"), "value", val, "impact", r3(c[i] * (val - ((Number) f.get("mean")).doubleValue())))); }
    double p = sig(z); int best = -1; double bestGain = 0;
    for (int i = 0; i < c.length; i++) { double gain = c[i] * Math.min(step, hi - v[i]); if (gain > bestGain) { bestGain = gain; best = i; } }
    Map<String,Object> out = new LinkedHashMap<>(); out.put("probability", Math.round(p * 1000) / 10.0); out.put("drivers", drivers);
    if (best >= 0) out.put("bestLever", Map.of("label", fs.get(best).get("label"), "delta", Math.min(step, hi - v[best]), "newProbability", Math.round(sig(z + bestGain) * 1000) / 10.0));
    out.put("metrics", m.get("metrics")); return out; }
}
