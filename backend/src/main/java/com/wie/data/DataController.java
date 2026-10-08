package com.wie.data;
import com.wie.model.User;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api")
public class DataController {
  private final DataService data;
  public DataController(DataService data){ this.data = data; }
  @GetMapping("/health") public Map<String,String> health(){ return Map.of("status", "UP"); }
  @GetMapping("/data/market")
  public Map<String,Object> market(@AuthenticationPrincipal User u){
    Map<String,Object> m = new LinkedHashMap<>(data.insights()); m.remove("facts"); m.remove("digest"); m.remove("callouts");
    m.put("callout", data.callout(u.role().name())); return m; }
  @PostMapping("/data/predict/{model}")
  public Map<String,Object> predict(@PathVariable String model, @RequestBody Map<String,Double> body){ return data.predict(model, body); }
}
