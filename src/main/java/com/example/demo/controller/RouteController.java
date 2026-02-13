/*package com.example.demo.controller;

import com.example.demo.model.RouteResponse;
import com.example.demo.service.AiRouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class RouteController {
    @Autowired
    private AiRouteService aiRouteService;

    @GetMapping("/route")
    public RouteResponse getRoute(@RequestParam String from, @RequestParam String to) {
        return aiRouteService.getOptimizedRoute(from, to);
    }
}*/