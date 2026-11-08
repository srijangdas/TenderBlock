package icu.telepathystudios.puretender.util;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {
    @Value("${jwt.custom.password}")
    private String SECRET;

    public String generateToken(String username, String role){
        return JWT.create()
                .withSubject(username)
                .withClaim("role", role)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 60 * 60* 1000))
                .sign(Algorithm.HMAC256(SECRET));
    }

    public String validateToken(String token){
        return JWT.require(Algorithm.HMAC256(SECRET)).build().verify(token).getSubject();
    }

    public String getRole(String token){
        return JWT.decode(token).getClaim("role").asString();
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString() + UUID.randomUUID();
    }
}
