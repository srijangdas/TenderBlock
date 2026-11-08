
package icu.telepathystudios.puretender.service.blockchain;

import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.TlsChannelCredentials;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.hyperledger.fabric.client.Contract;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.Network;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;

@Service
public class FabricService {

    @Value("${fabric.crypto-path}")
    private String cryptoPath;

    @Value("${fabric.peer-endpoint}")
    private String peerEndpoint;

    @Value("${fabric.peer-hostname}")
    private String peerHostname;

    @Value("${fabric.channel}")
    private String channelName;

    @Value("${fabric.chaincode}")
    private String chaincodeName;

    private ManagedChannel channel;
    private Gateway gateway;
    private Contract contract;

    @PostConstruct
    public void init() throws Exception {
        Path orgPath = Paths.get(cryptoPath)
                .resolve("org1.example.com");

        Path certPath = orgPath.resolve(
                "users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem");

        Path tlsCertPath = orgPath.resolve(
                "peers/peer0.org1.example.com/tls/ca.crt");

        if (!Files.isRegularFile(certPath)) {
            throw new IllegalStateException(
                    "Fabric identity certificate not found: " + certPath.toAbsolutePath());
        }

        if (!Files.isRegularFile(tlsCertPath)) {
            throw new IllegalStateException(
                    "Fabric TLS CA certificate not found: " + tlsCertPath.toAbsolutePath());
        }

        channel = Grpc.newChannelBuilder(
                        peerEndpoint,
                        TlsChannelCredentials.newBuilder()
                                .trustManager(tlsCertPath.toFile())
                                .build())
                .overrideAuthority(peerHostname)
                .build();

        Signer signer = Signers.newPrivateKeySigner(getPrivateKey(orgPath));

        var identity = new X509Identity(
                "Org1MSP",
                readCertificate(certPath));

        gateway = Gateway.newInstance()
                .identity(identity)
                .signer(signer)
                .connection(channel)
                .evaluateOptions(o -> o.withDeadlineAfter(10, TimeUnit.SECONDS))
                .endorseOptions(o -> o.withDeadlineAfter(30, TimeUnit.SECONDS))
                .submitOptions(o -> o.withDeadlineAfter(30, TimeUnit.SECONDS))
                .commitStatusOptions(o -> o.withDeadlineAfter(60, TimeUnit.SECONDS))
                .connect();

        Network network = gateway.getNetwork(channelName);
        contract = network.getContract(chaincodeName);
    }

    private PrivateKey getPrivateKey(Path orgPath) throws Exception {
        Path keyDir = orgPath.resolve(
                "users/User1@org1.example.com/msp/keystore");

        try (var files = Files.list(keyDir)) {
            Path keyPath = files
                    .filter(Files::isRegularFile)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException(
                            "Private key not found in: " + keyDir.toAbsolutePath()));

            try (var reader = Files.newBufferedReader(
                    keyPath, StandardCharsets.UTF_8)) {
                return Identities.readPrivateKey(reader);
            }
        }
    }

    private X509Certificate readCertificate(Path certPath) throws Exception {
        try (var input = Files.newInputStream(certPath)) {
            return (X509Certificate) CertificateFactory
                    .getInstance("X.509")
                    .generateCertificate(input);
        }
    }

    public String getAllAssets() throws Exception {
        byte[] result = contract.evaluateTransaction("GetAllAssets");
        return new String(result, StandardCharsets.UTF_8);
    }

    public String createAsset(
            String assetId,
            String color,
            int size,
            String owner,
            int appraisedValue) throws Exception {

        contract.submitTransaction(
                "CreateAsset",
                assetId,
                color,
                String.valueOf(size),
                owner,
                String.valueOf(appraisedValue));

        return "Asset created successfully with ID: " + assetId;
    }

    @PreDestroy
    public void shutdown() {
        if (gateway != null) {
            gateway.close();
        }

        if (channel != null) {
            channel.shutdownNow();
        }
    }
}
