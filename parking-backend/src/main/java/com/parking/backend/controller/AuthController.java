package com.parking.backend.controller;

import com.parking.backend.model.dto.AuthResponse;
import com.parking.backend.model.dto.LoginRequest;
import com.parking.backend.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.parking.backend.model.dto.ForgotPasswordRequest;
import com.parking.backend.model.dto.ResetPasswordRequest;
import com.parking.backend.service.EmailService;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.parking.backend.repository.AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // Mock OTP storage (In-memory for demo purposes)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);

        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith("ROLE_"))
                .findFirst()
                .orElse("ROLE_USER")
                .replace("ROLE_", "");

        java.util.List<String> permissions = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> !auth.startsWith("ROLE_"))
                .collect(java.util.stream.Collectors.toList());

        com.parking.backend.model.entity.Account account = accountRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .accountId(account.getAccountId())
                .username(userDetails.getUsername())
                .role(role)
                .permissions(permissions)
                .build());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail();
        com.parking.backend.model.entity.Account account = accountRepository.findByUsername(email) // Using email as username per context or searching by email
                .orElse(null);

        // Fallback to find by email if username doesn't match
        if (account == null) {
            account = accountRepository.findAll().stream()
                    .filter(a -> email.equals(a.getEmail()))
                    .findFirst()
                    .orElse(null);
        }

        if (account == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email not found"));
        }

        // Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, otp);

        // Send Email
        String subject = "Parking System - Password Reset OTP";
        String body = "Your OTP for password reset is: " + otp + "\nThis OTP will expire shortly.";
        emailService.sendEmail(email, subject, body);

        return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        String email = request.getEmail();
        String storedOtp = otpStorage.get(email);

        if (storedOtp == null || !storedOtp.equals(request.getOtp())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired OTP"));
        }

        com.parking.backend.model.entity.Account account = accountRepository.findByUsername(email)
                .orElse(null);

        if (account == null) {
            account = accountRepository.findAll().stream()
                    .filter(a -> email.equals(a.getEmail()))
                    .findFirst()
                    .orElse(null);
        }

        if (account == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Account not found"));
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountRepository.save(account);
        otpStorage.remove(email);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
