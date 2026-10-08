package com.wie.intelligence;
import com.wie.data.DataService;
import java.util.List;
import org.springframework.stereotype.Service;
/** Data-driven: skill groups with demand (% of postings), junior proficiency (%), unmet-demand index and link to salary hikes. */
@Service
public class DemoIntelligenceService implements IntelligenceService {
  private final DataService data;
  public DemoIntelligenceService(DataService data){ this.data = data; }
  public List<SkillForecast> forecasts(){
    return data.categories().stream().map(c -> new SkillForecast((String) c.get("name"), ((Number) c.get("proficiencyPct")).intValue(),
      (int) Math.round(((Number) c.get("demandPct")).doubleValue()), ((Number) c.get("unmet")).intValue(), (String) c.get("risk"),
      (int) Math.round(((Number) c.get("link")).doubleValue() * 100))).toList(); }
  public List<Intervention> interventionsFor(String skill){ return List.of(
    new Intervention("STUDENT", "Practise " + skill + " with a small project, then take the assessment"),
    new Intervention("COLLEGE", "Add hands-on " + skill + " labs to the curriculum"),
    new Intervention("RECRUITER", "Add a " + skill + " test to your screening"),
    new Intervention("COURSE_AGENCY", "Launch a " + skill + " course in My Courses")); }
}
