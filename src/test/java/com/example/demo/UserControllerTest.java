/*package com.example.demo;

import com.example.demo.controller.UserController;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserControllerTest {

    private UserController userController;

    private UserRepository userRepository;
    private UserProfileRepository userProfileRepository;

    @BeforeEach
    void setup() {
        userRepository = mock(UserRepository.class);
        userProfileRepository = mock(UserProfileRepository.class);

        // Make sure UserController has a constructor with these arguments
        userController = new UserController(userRepository, userProfileRepository);
    }

    @Test
    void testGetAllUsers() {
        User user1 = new User();
        user1.setEmail("user1@example.com");

        User user2 = new User();
        user2.setEmail("user2@example.com");

        when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2));

        List<User> users = userController.getAllUsers();
        assertEquals(2, users.size());
        assertEquals("user1@example.com", users.get(0).getEmail());
    }

    @Test
    void testAuthenticationMock() {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("user123");
        when(auth.isAuthenticated()).thenReturn(true);

        assertEquals("user123", auth.getName());
        assertTrue(auth.isAuthenticated());
    }
}*/
