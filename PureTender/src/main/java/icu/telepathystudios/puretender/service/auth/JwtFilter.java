package icu.telepathystudios.puretender.service.auth;

import icu.telepathystudios.puretender.util.JwtUtil;
import icu.telepathystudios.puretender.config.ApiSecurityError;
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                                   HttpServletResponse response,
                                                   FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();

        String header = request.getHeader("Authorization");

        if(path.startsWith("/api/auth")) {
            chain.doFilter(request, response);
            return;
        }

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(7);

        try{
            String username = jwtUtil.validateToken(token);
            String role = jwtUtil.getRole(token);

            List<GrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority("ROLE_" + role));

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getOutputStream(), new ApiSecurityError(
                    Instant.now(), HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
                    "Invalid or expired bearer token", request.getRequestURI(),
                    request.getMethod(), null, List.of()
            ));
            return;
        }

        chain.doFilter(request, response);
    }
}
