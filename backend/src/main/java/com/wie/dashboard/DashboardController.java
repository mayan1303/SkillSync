package com.wie.dashboard;
import com.wie.course.CourseRepository;
import com.wie.data.DataService;
import com.wie.intelligence.IntelligenceService;
import com.wie.model.*;
import com.wie.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
/** Role access is enforced in SecurityConfig by URL prefix. Every payload is derived from the logged-in user / real DB data. */
@RestController @RequestMapping("/api")
public class DashboardController {
  public record SkillsReq(@NotNull @Size(max = 30) List<@NotBlank @Size(max = 60) String> skills) {}
  public record WhatIfReq(@NotNull @Size(max = 10) List<String> skills) {}
  private final IntelligenceService intel; private final StudentInsights ins; private final UserRepository users; private final DataService data; private final CourseRepository courses;
  public DashboardController(IntelligenceService intel, StudentInsights ins, UserRepository users, DataService data, CourseRepository courses){ this.intel=intel; this.ins=ins; this.users=users; this.data=data; this.courses=courses; }

  @GetMapping("/student/dashboard")
  public Map<String,Object> student(@AuthenticationPrincipal User u){ return ins.dashboard(u, intel); }

  @PutMapping("/student/skills")
  public Map<String,Object> saveSkills(@AuthenticationPrincipal User u, @Valid @RequestBody SkillsReq r){
    Map<String,Object> p = new HashMap<>(u.profile() == null ? Map.of() : u.profile()); p.put("skills", r.skills());
    User n = users.save(new User(u.id(), u.name(), u.email(), u.passwordHash(), u.role(), u.verified(), p, u.createdAt()));
    return ins.dashboard(n, intel); }

  @PostMapping("/student/whatif")
  public Map<String,Object> whatIf(@AuthenticationPrincipal User u, @Valid @RequestBody WhatIfReq r){ return ins.whatIf(u, r.skills()); }

  @GetMapping("/recruiter/dashboard")
  public Map<String,Object> recruiter(@AuthenticationPrincipal User u){
    List<User> st = users.findByRole(Role.STUDENT);
    Map<String,Long> counts = new LinkedHashMap<>();
    for (String s : StudentInsights.W.keySet()) counts.put(s, st.stream().filter(x -> ins.levels(ins.skillsOf(x)).containsKey(s)).count());
    return Map.of("company", String.valueOf(u.profile().get("company")), "openPositions", data.metaInt("dsPostings"), "talentPipeline", st.size(),
      "platformSkillCounts", counts, "riskRadar", intel.forecasts(), "interventions", intel.interventionsFor(top())); }

  private String top(){ return intel.forecasts().stream().max(Comparator.comparingInt(IntelligenceService.SkillForecast::gap)).map(IntelligenceService.SkillForecast::skill).orElse("Data Science"); }
  private String topMarketSkill(){ return (String) data.topSkills(1).get(0).get("name"); }
  private Map<String,Object> opportunity(long lacking){
    Map<String,Object> t = data.topSkills(1).get(0); String s = (String) t.get("name");
    long have = courses.findAllByOrderByCreatedAtDesc().stream().filter(c -> c.skill().equalsIgnoreCase(s)).count();
    return Map.of("skill", s, "demandGrowthPct", t.get("pct"), "potentialLearners", lacking, "companiesHiring", data.metaInt("companies"), "competition", have == 0 ? "LOW" : have < 3 ? "MEDIUM" : "HIGH"); }

  @GetMapping("/agency/dashboard")
  public Map<String,Object> agency(@AuthenticationPrincipal User u){
    long lacking = users.findByRole(Role.STUDENT).stream().filter(x -> !ins.levels(ins.skillsOf(x)).containsKey(topMarketSkill())).count();
    return Map.of("agency", u.name(), "highDemand", intel.forecasts(),
      "topOpportunity", opportunity(lacking)); }
}
