package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/temp") // changed base path
public class TempRegisterController {

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "🎉 Temp registration success!"
        ));
    }
}


