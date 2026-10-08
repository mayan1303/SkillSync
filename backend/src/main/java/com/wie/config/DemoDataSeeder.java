package com.wie.config;
import com.wie.model.*;
import com.wie.repository.UserRepository;
import java.time.Instant;
import java.util.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
/** Dev only (SEED_DEMO=true). Adds any missing demo user. Password for all: Demo@12345 */
@Component @ConditionalOnProperty(name = "app.seed-demo", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {
  private final UserRepository users; private final PasswordEncoder enc;
  public DemoDataSeeder(UserRepository users, PasswordEncoder enc){ this.users=users; this.enc=enc; }
  private static Map<String,Object> stu(String... skills){ return Map.of("college","Thapar","degree","B.Tech","branch","CSE","graduationYear","2026","skills",List.of(skills)); }
  public void run(String... args){
    add("Aryan Sharma","aryan@demo.com",Role.STUDENT,stu("Python:92","Machine Learning:78","SQL:70","Statistics:55","Data Visualization:32"));
    add("Riya Verma","riya@demo.com",Role.STUDENT,stu("SQL:88","Python:85","Excel:75","Data Visualization:70"));
    add("Kabir Singh","kabir@demo.com",Role.STUDENT,stu("Python:60","Machine Learning:80","Deep Learning:72","Statistics:65"));
    add("Sana Khan","sana@demo.com",Role.STUDENT,stu("R:78","Statistics:82","SAS:70","SQL:55"));
    add("Dev Patel","dev@demo.com",Role.STUDENT,stu("Spark:75","Big Data:80","Python:60","SQL:68"));
    add("Meera Nair","recruiter@demo.com",Role.RECRUITER,Map.of("company","NeuraWorks","designation","Talent Lead","industry","AI","companySize","500-1000"));
    add("SkillForge Academy","agency@demo.com",Role.COURSE_AGENCY,Map.of("contactPerson","R. Singh","specialization","Applied AI","deliveryMode","Hybrid","location","Chandigarh"));
  }
  private void add(String n,String e,Role r,Map<String,Object> p){
    if (users.existsByEmail(e)) return;
    users.save(new User(null,n,e,enc.encode("Demo@12345"),r,true,p,Instant.now())); }
}
