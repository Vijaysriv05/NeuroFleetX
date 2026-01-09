package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.config.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    void testGetUsers_Success() throws Exception {

        // ✅ Create user using NO-ARGS constructor
        User user = new User();
        user.setUserId(1L);
        user.setUsername("testuser");
        user.setEmail("test@email.com");
        user.setPassword("encodedpass");
        user.setRoleId(1);

        // Mock repository
        when(userRepository.findAll()).thenReturn(List.of(user));

        // Mock JWT validation
        when(jwtUtil.validateToken("validToken")).thenReturn(true);

        mockMvc.perform(
                get("/api/users")
                        .header("Authorization", "Bearer validToken")
        ).andExpect(status().isOk());
    }
}


