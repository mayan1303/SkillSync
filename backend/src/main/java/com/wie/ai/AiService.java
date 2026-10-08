package com.wie.ai;
import com.wie.exception.ApiException;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
/** One entry point for LLM calls. Uses Claude if ANTHROPIC_API_KEY is set, otherwise Gemini (free tier) if GEMINI_API_KEY is set. Keys never leave the server. */
@Service
public class AiService {
  private final RestClient http; private final String ak, gk, am, gm;
  public AiService(@Value("${ai.anthropic-key}") String ak, @Value("${ai.gemini-key}") String gk,
                   @Value("${ai.anthropic-model}") String am, @Value("${ai.gemini-model}") String gm){
    var f = new SimpleClientHttpRequestFactory(); f.setConnectTimeout(5000); f.setReadTimeout(25000);
    this.http = RestClient.builder().requestFactory(f).build(); this.ak=ak; this.gk=gk; this.am=am; this.gm=gm; }
  public boolean configured(){ return !ak.isBlank() || !gk.isBlank(); }

  @SuppressWarnings("unchecked")
  public String chat(String system, List<Map<String,String>> msgs, int maxTokens){
    if (!configured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_NOT_CONFIGURED",
      "AI is not configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY and restart the backend.");
    try {
      if (!ak.isBlank()) {
        Map<String,Object> res = http.post().uri("https://api.anthropic.com/v1/messages").header("x-api-key", ak).header("anthropic-version", "2023-06-01")
          .contentType(MediaType.APPLICATION_JSON).body(Map.of("model", am, "max_tokens", maxTokens, "system", system, "messages", msgs)).retrieve().body(Map.class);
        return String.valueOf(((List<Map<String,Object>>) res.get("content")).get(0).get("text")); }
      List<Map<String,Object>> contents = new ArrayList<>();
      for (Map<String,String> m : msgs) contents.add(Map.of("role", m.get("role").equals("assistant") ? "model" : "user", "parts", List.of(Map.of("text", m.get("content")))));
      Map<String,Object> res = http.post().uri("https://generativelanguage.googleapis.com/v1beta/models/" + gm + ":generateContent").header("x-goog-api-key", gk)
        .contentType(MediaType.APPLICATION_JSON).body(Map.of("systemInstruction", Map.of("parts", List.of(Map.of("text", system))), "contents", contents,
          "generationConfig", Map.of("maxOutputTokens", maxTokens * 5))).retrieve().body(Map.class);
      Map<String,Object> content = (Map<String,Object>) ((List<Map<String,Object>>) res.get("candidates")).get(0).get("content");
      return String.valueOf(((List<Map<String,Object>>) content.get("parts")).get(0).get("text"));
    } catch (Exception e) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_ERROR", "The AI service failed. Check your API key and model name."); }
  }
}
