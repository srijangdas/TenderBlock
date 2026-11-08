package icu.telepathystudios.puretender.service.auth;


import icu.telepathystudios.puretender.dto.auth.AuthResponse;
import icu.telepathystudios.puretender.dto.auth.LoginRequest;
import icu.telepathystudios.puretender.dto.auth.RegisterRequest;
import icu.telepathystudios.puretender.model.enums.AccountStatus;
import icu.telepathystudios.puretender.model.enums.Role;
import icu.telepathystudios.puretender.model.classes.User;
import icu.telepathystudios.puretender.repo.AuthRepo;
import icu.telepathystudios.puretender.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthRepo authRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request, Role role) {

        String email = normalizeEmail(request.email());

        if (authRepo.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists"
            );
        }
        if (role == Role.ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin registration is not allowed"
            );
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );

        user.setRole(role);

        User savedUser = authRepo.saveAndFlush(user);

        String token = jwtUtil.generateToken(savedUser.getEmail(), role.name());

        return toAuthResponse(savedUser, token);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        String email = normalizeEmail(request.email());

        User user = authRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        if (user.getStatus() == AccountStatus.REJECTED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account registration has been rejected"
            );
        }

        if (user.getStatus() == AccountStatus.DISABLED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account has been disabled"
            );
        }

        String token = jwtUtil.generateToken(user.getEmail(),  user.getRole().name());

        return toAuthResponse(user, token);
    }

    private AuthResponse toAuthResponse(
            User user,
            String token) {

        return new AuthResponse(
                token,
                "Bearer",
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
