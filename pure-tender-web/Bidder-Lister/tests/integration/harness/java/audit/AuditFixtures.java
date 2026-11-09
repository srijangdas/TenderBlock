package audit;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.model.enums.Role;
import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.repo.AuthRepo;
@Configuration
public class AuditFixtures {
 @Bean ApplicationRunner seed(AuthRepo users, PasswordEncoder encoder) {
  return args -> {
   for (Role role : new Role[]{Role.ADMIN, Role.EVALUATOR}) {
    if (users.findByEmail(role.name().toLowerCase() + "@audit.test").isPresent()) continue;
    User user = new User(); user.setFullName("Integration " + role);
    user.setEmail(role.name().toLowerCase() + "@audit.test");
    user.setPasswordHash(encoder.encode("AuditPass123!"));
    user.setRole(role); user.setStatus(AccountStatus.VERIFIED);
    users.saveAndFlush(user);
   }
   System.out.println("INTEGRATION_FIXTURES_READY");
  };
 }
}
