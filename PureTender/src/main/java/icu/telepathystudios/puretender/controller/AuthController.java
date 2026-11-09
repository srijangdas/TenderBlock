package icu.telepathystudios.puretender.controller;


import icu.telepathystudios.puretender.dto.auth.AuthResponse;
import icu.telepathystudios.puretender.dto.auth.AccountStatusResponse;
import icu.telepathystudios.puretender.dto.auth.LoginRequest;
import icu.telepathystudios.puretender.dto.auth.RegisterRequest;
import icu.telepathystudios.puretender.model.enums.Role;
import icu.telepathystudios.puretender.service.auth.AuthService;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/{role}")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request, @PathVariable Role role) {

        AuthResponse response = authService.register(request, role);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me/status")
    public ResponseEntity<AccountStatusResponse> getCurrentAccountStatus(
            Authentication authentication) {
        return ResponseEntity.ok(
                authService.getCurrentAccountStatus(authentication.getName())
        );
    }
}
