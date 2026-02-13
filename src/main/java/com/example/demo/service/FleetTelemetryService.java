package com.example.demo.service;

import com.example.demo.entity.Vehicle;
import com.example.demo.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@EnableScheduling
public class FleetTelemetryService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Push fleet updates to all connected managers every 5 seconds
    @Scheduled(fixedRate = 5000)
    public void pushTelemetry() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        // Broadcasts to any frontend subscribed to /topic/vehicles
        messagingTemplate.convertAndSend("/topic/vehicles", vehicles);
    }
}
