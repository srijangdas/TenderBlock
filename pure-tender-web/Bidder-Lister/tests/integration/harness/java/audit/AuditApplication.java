package audit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.context.annotation.*;
import icu.telepathystudios.puretender.PureTenderApplication;
import icu.telepathystudios.puretender.service.blockchain.FabricService;
import icu.telepathystudios.puretender.controller.test.BlockchainController;
@SpringBootConfiguration
@EnableAutoConfiguration
@EntityScan("icu.telepathystudios.puretender.model.classes")
@EnableJpaRepositories("icu.telepathystudios.puretender.repo")
@Import({AuditFixtures.class, AuditFabricBoundary.class})
@ComponentScan(basePackages="icu.telepathystudios.puretender", excludeFilters=@ComponentScan.Filter(type=FilterType.ASSIGNABLE_TYPE, classes={PureTenderApplication.class,FabricService.class,BlockchainController.class}))
public class AuditApplication {
 public static void main(String[] args) { SpringApplication.run(AuditApplication.class,args); }
}
