package audit;

import icu.telepathystudios.puretender.service.blockchain.FabricService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/** Test transport boundary ONLY. Never a Fabric integration test or production bean. */
@Configuration
@Profile("fabric-boundary-test")
public class AuditFabricBoundary {
    @Bean
    FabricService auditFabric(@Value("${audit.fabric-accept:false}") boolean accept) {
        return new FabricService() {
            @Override public void init() { /* no Fabric certificates or network */ }
            @Override public void createIntegrityRecord(String id, String type, String parent, String hash) throws Exception {
                checkBoundary();
            }
            @Override public void updateIntegrityRecord(String id, String hash) throws Exception {
                checkBoundary();
            }
            private void checkBoundary() throws Exception {
                if (!accept) throw new java.io.IOException("Intentional unavailable Fabric transport in isolated audit");
            }
        };
    }
}
