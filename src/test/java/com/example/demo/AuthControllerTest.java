package com.example.demo;

import com.example.demo.repository.BookingRepository;
import com.example.demo.config.JwtUtil;
import com.example.demo.controller.AuthController;
import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import com.example.demo.repository.VehicleRepository;
import com.example.demo.repository.CustomerVehicleRepository;
import com.example.demo.repository.AuditLogRepository;
import com.example.demo.repository.FeedbackRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AuthControllerTest {
    @Mock
    private BookingRepository bookingRepository; // Add this line

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private CustomerVehicleRepository customerVehicleRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtUtil jwtUtil;
    private AuthController authController;

    private User testUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);

        // Simple anonymous implementation of JwtUtil for testing
        jwtUtil = new JwtUtil() {
            @Override
            public String generateToken(String email) {
                return "dummy-token-for-" + email;
            }
        };

        // FIXED: Constructor call now uses exactly 7 parameters.
        // feedbackRepository is excluded here because it is handled via @Autowired in AuthController.
        authController = new AuthController(
                userRepository,
                userProfileRepository,
                vehicleRepository,
                customerVehicleRepository,
                bookingRepository,
                auditLogRepository,
                passwordEncoder,
                jwtUtil
        );

        // Initialize test user with correct Long ID (using 'L' suffix)
        testUser = new User();
        testUser.setUserId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setRoleId(1);
        testUser.setUsername("Test User");
    }

    @Test
    public void testLogin_Success() {
        // Setup mock behavior
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);

        UserProfile profile = new UserProfile();
        profile.setName("Test User");
        profile.setEmail("test@example.com");
        when(userProfileRepository.findByEmail("test@example.com")).thenReturn(Optional.of(profile));

        // Create a request user object
        User loginRequest = new User();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
        loginRequest.setRoleId(1);

        ResponseEntity<?> response = authController.login(loginRequest);

        assertEquals(200, response.getStatusCode().value());
        String body = response.getBody().toString();
        assertTrue(body.contains("Login Successful"));
        assertTrue(body.contains("dummy-token-for-test@example.com"));
    }

    @Test
    public void testLogin_IncorrectPassword() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), eq(testUser.getPassword()))).thenReturn(false);

        ResponseEntity<?> response = authController.login(testUser);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().toString().contains("Incorrect password"));
    }

    @Test
    public void testLogin_UserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        User unknownUser = new User();
        unknownUser.setEmail("unknown@example.com");
        unknownUser.setPassword("password123");
        unknownUser.setRoleId(1);

        ResponseEntity<?> response = authController.login(unknownUser);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(response.getBody().toString().contains("Email not found"));
    }
}