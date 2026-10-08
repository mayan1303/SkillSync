package com.wie.dashboard;
import com.wie.data.DataService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
/** Simulation, early-warning and outcome endpoints. Replace the demo data with real services later. */
@RestController @RequestMapping("/api")
public class IntelligenceController {
  private final DataService data;
  public IntelligenceController(DataService data){ this.data = data; }
  public record SimReq(@Min(0) @Max(1000000) int demand, @Min(0) @Max(1000000) int supply,
                       @Min(0) @Max(1000000) int capacity, @Min(0) @Max(100) int completion) {}

  @PostMapping("/intel/simulate")
  public Map<String,Object> simulate(@Valid @RequestBody SimReq r){
    int gap0 = Math.max(0, r.demand() - r.supply());
    double supply = r.supply() + r.capacity() * r.completion() / 100.0;
    double gap1 = Math.max(0, r.demand() - supply);
    double red = gap0 == 0 ? 0 : Math.round((gap0 - gap1) / gap0 * 1000) / 10.0;
    return Map.of("gapBefore", gap0, "projectedSupply", Math.round(supply), "gapAfter", Math.round(gap1), "reductionPct", red); }

  @GetMapping("/intel/alerts")
  public List<Map<String,Object>> alerts(){ return data.alerts(); }

  @GetMapping("/intel/outcomes")
  public Map<String,Object> outcomes(){ return Map.of("funnel", List.of(
    Map.of("stage","Trained","count",842), Map.of("stage","Passed","count",671), Map.of("stage","Industry-ready","count",350),
    Map.of("stage","Interviews","count",280), Map.of("stage","Hired","count",190)), "skillGapReducedPct", 61); }
}
