package icu.telepathystudios.puretender.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiSecurityError> handleResponseStatusException(
            ResponseStatusException exception,
            HttpServletRequest request
    ) {
        int status = exception.getStatusCode().value();
        HttpStatus httpStatus = HttpStatus.resolve(status);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        List<String> authorities = authentication == null ? List.of() : authentication.getAuthorities()
                .stream().map(authority -> authority.getAuthority()).toList();
        String principal = authentication == null ? null : String.valueOf(authentication.getPrincipal());

        ApiSecurityError body = new ApiSecurityError(
                Instant.now(),
                status,
                httpStatus == null ? "HTTP Error" : httpStatus.getReasonPhrase(),
                exception.getReason() == null ? "Request could not be completed" : exception.getReason(),
                request.getRequestURI(),
                request.getMethod(),
                principal,
                authorities
        );

        return ResponseEntity.status(exception.getStatusCode()).body(body);
    }
}
