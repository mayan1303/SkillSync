package com.wie.ai;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
/** Plug-in for YOUR trained chatbot. Set CUSTOM_BOT_URL. We POST {message, history, context, role}; it must answer JSON {reply}. Falls back to the LLM if it fails. */
@Service
public class CustomBotClient {
  private final RestClient http; private final String url, key;
  public CustomBotClient(@Value("${ai.custom-url}") String url, @Value("${ai.custom-key}") String key){
    var f = new SimpleClientHttpRequestFactory(); f.setConnectTimeout(5000); f.setReadTimeout(30000);
    http = RestClient.builder().requestFactory(f).build(); this.url = url; this.key = key; }
  public boolean configured(){ return !url.isBlank(); }
  @SuppressWarnings("unchecked")
  public String ask(String message, List<Map<String,String>> history, String context, String role){
    try {
      RestClient.RequestBodySpec spec = http.post().uri(url).contentType(MediaType.APPLICATION_JSON);
      if (!key.isBlank()) spec = spec.header("Authorization", "Bearer " + key);
      Map<String,Object> res = spec.body(Map.of("message", message, "history", history, "context", context, "role", role)).retrieve().body(Map.class);
      if (res != null) for (String k : new String[]{"reply", "response", "answer", "text", "output"}) if (res.get(k) != null) return String.valueOf(res.get(k));
    } catch (Exception e) { /* fall back to the LLM */ }
    return null; }
}
