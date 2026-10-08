package com.wie.intelligence;
import java.util.List;
/** Plug-in point: swap DemoIntelligenceService for a real ML forecasting engine without touching controllers. */
public interface IntelligenceService {
  record SkillForecast(String skill, int currentSupply, int projectedDemand, int gap, String risk, int momentumPct) {}
  record Intervention(String stakeholder, String action) {}
  List<SkillForecast> forecasts();
  List<Intervention> interventionsFor(String skill);
}
