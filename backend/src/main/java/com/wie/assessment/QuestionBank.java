package com.wie.assessment;
import java.util.*;
import org.springframework.stereotype.Service;
/** Offline question sets (used when no AI key, or as fallback). Weight w = difficulty 1-3. Accepted answers never leave the server. */
@Service
public class QuestionBank {
  public record Q(String id, String text, List<String> answers, int w) {}
  private final Map<String,List<Q>> bank = new LinkedHashMap<>();
  private static Q q(String id, int w, String t, String... a){ return new Q(id, t, List.of(a), w); }
  public QuestionBank(){
    bank.put("Python", List.of(q("py1",1,"Keyword that defines a function?","def"), q("py2",1,"Immutable type: list or tuple?","tuple"), q("py3",2,"Popular library for DataFrames?","pandas"),
      q("py4",2,"What does len([1,2,3]) return?","3","three"), q("py5",3,"Keyword for a one-line anonymous function?","lambda")));
    bank.put("SQL", List.of(q("sq1",1,"Clause that filters rows?","where"), q("sq2",1,"Keyword that combines rows from two tables?","join"), q("sq3",2,"Clause used to group rows for aggregates?","group by","group"),
      q("sq4",2,"Which clause filters aggregated results?","having"), q("sq5",3,"Window function that numbers rows 1,2,3?","row number","rownumber")));
    bank.put("Statistics", List.of(q("st1",1,"Average of a dataset?","mean","average"), q("st2",1,"Middle value of sorted data?","median"),
      q("st3",2,"Rejecting a true null hypothesis is a Type what error?","type 1","type i","type one","alpha"), q("st4",2,"Square root of variance?","standard deviation","deviation","std"),
      q("st5",3,"Measure between -1 and 1 of linear relationship?","correlation","pearson")));
    bank.put("Machine Learning", List.of(q("ml1",1,"Learning from labelled data is called?","supervised"), q("ml2",1,"Model memorising training data is called?","overfit"),
      q("ml3",2,"Evaluating a model on several data splits is called?","cross validation","cv"), q("ml4",2,"Correct positives out of predicted positives?","precision"),
      q("ml5",3,"Regularisation that shrinks coefficients using absolute values?","lasso","l1")));
    bank.put("Data Visualization", List.of(q("dv1",1,"Best chart for trends over time?","line"), q("dv2",1,"Name one popular BI dashboard tool.","tableau","power bi","powerbi","qlik","looker"),
      q("dv3",2,"Chart for the relationship of two numeric variables?","scatter"), q("dv4",2,"Chart showing the distribution of one numeric variable?","histogram"),
      q("dv5",3,"Plot summarising median and quartiles?","box","boxplot","whisker")));
  }
  public Set<String> skills(){ return bank.keySet(); }
  public List<Q> questions(String skill){ return bank.getOrDefault(skill, List.of()); }
  public boolean matches(Q q, String answer){
    String n = answer == null ? "" : answer.toLowerCase().replaceAll("[^a-z0-9 ]", " ").trim();
    String[] tokens = n.split("\\s+");
    for (String a : q.answers()) {
      if (a.contains(" ")) { if (n.contains(a)) return true; continue; }
      for (String t : tokens) if (a.length() <= 3 ? t.equals(a) : t.startsWith(a)) return true; }
    return false; }
}
