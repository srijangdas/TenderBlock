import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const backendDir = process.argv[2] || process.env.TENDERBLOCK_BACKEND_DIR;
if (!backendDir || !existsSync(resolve(backendDir, 'pom.xml'))) {
  throw new Error('Pass the path to unmodified PureTender. Latest PostgreSQL audit: b6f73c88a484469473581f6032591fbb0df12a24.');
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), 'harness');
const original = readFileSync(resolve(backendDir, 'pom.xml'), 'utf8');
const pom = original
  .replace('<artifactId>PureTender</artifactId>', '<artifactId>bidder-lister-integration-harness</artifactId>')
  .replace('</dependencies>', '<dependency><groupId>com.h2database</groupId><artifactId>h2</artifactId><scope>runtime</scope></dependency></dependencies>')
  .replace('<build>', `<build>
    <sourceDirectory>\${tenderblock.backend.dir}/src/main/java</sourceDirectory>
    <testSourceDirectory>\${project.basedir}/no-backend-tests</testSourceDirectory>
    <resources><resource><directory>resources</directory></resource></resources>`)
  .replace('<plugins>', `<plugins><plugin>
    <groupId>org.codehaus.mojo</groupId><artifactId>build-helper-maven-plugin</artifactId><version>3.6.0</version>
    <executions><execution><id>integration-runner</id><phase>generate-sources</phase><goals><goal>add-source</goal></goals>
    <configuration><sources><source>\${project.basedir}/java</source></sources></configuration></execution></executions>
  </plugin>`);
writeFileSync(resolve(root, 'pom.xml'), pom);
console.log('Wrote the test harness POM. Backend sources will be compiled from:', resolve(backendDir));
console.log('Start this POM with -Dtenderblock.backend.dir=<absolute PureTender path> -Dspring-boot.run.main-class=audit.AuditApplication');
