package icu.telepathystudios.puretender.service.blockchain;

import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import java.util.HexFormat;

@Service
public class DocumentHashService {

    //region SHA-256 generation and verification
    public String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(content)
            );
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    public boolean matches(byte[] content, String expectedHash) {
        if (content == null || expectedHash == null) {
            return false;
        }

        byte[] expected = expectedHash.trim().toLowerCase(Locale.ROOT)
                .getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        byte[] actual = sha256(content).getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, actual);
    }
    //endregion
}
