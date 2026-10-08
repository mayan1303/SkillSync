package com.wie.exception;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
@RestControllerAdvice
public class GlobalExceptionHandler {
  public record ApiError(String code, String message, Object details) {}
  @ExceptionHandler(ApiException.class)
  ResponseEntity<ApiError> api(ApiException e){ return ResponseEntity.status(e.status).body(new ApiError(e.code,e.getMessage(),null)); }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e){
    Map<String,String> d=new HashMap<>();
    e.getBindingResult().getFieldErrors().forEach(f->d.put(f.getField(),f.getDefaultMessage()));
    return ResponseEntity.badRequest().body(new ApiError("VALIDATION_ERROR","Invalid input",d)); }
  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiError> denied(AccessDeniedException e){ return ResponseEntity.status(403).body(new ApiError("FORBIDDEN","Access denied",null)); }
  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> other(Exception e){ return ResponseEntity.status(500).body(new ApiError("INTERNAL_ERROR","Something went wrong",null)); }
}
