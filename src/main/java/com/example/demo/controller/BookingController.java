package com.example.demo.controller;

import com.example.demo.entity.Booking;
import com.example.demo.entity.TripHistory;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.TripHistoryRepository;
import com.example.demo.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TripHistoryRepository tripHistoryRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    // --- DASHBOARD SYNC & LIVE SIMULATION ---

    @GetMapping("/bookings/user/{userId}")
    public ResponseEntity<?> getBookingsByUser(@PathVariable String userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);

        if (bookings != null) {
            for (Booking b : bookings) {
                // Real-time calculation for active missions
                if ("TRIP_ACTIVE".equals(b.getStatus())) {
                    simulateLiveMetrics(b);
                }
            }
        }
        return ResponseEntity.ok(bookings != null ? bookings : Collections.emptyList());
    }

    private void simulateLiveMetrics(Booking b) {
        // Mission Parameters: 248.25 KM trip (e.g., Chennai route)
        double totalDist = 248.25;
        long totalMinutes = 192; // Approx 3.2 hours

        long minutesElapsed = Duration.between(b.getBookingTime(), LocalDateTime.now()).toMinutes();

        // Calculate Distance and Progress
        double distanceCovered = (double) minutesElapsed * (totalDist / totalMinutes);
        double remainingDist = Math.max(0, totalDist - distanceCovered);
        int progress = (int) Math.min(100, (distanceCovered / totalDist) * 100);

        // Calculate Energy Drain (Starts at 100%, drops as progress increases)
        int energyLeft = Math.max(0, 100 - progress);

        // Generate dynamic Velocity (60-80 KM/H)
        int currentVelocity = 60 + new Random().nextInt(20);

        // Update Entity fields for JSON response
        b.setDistance(String.format("%.2f", remainingDist));
        b.setDuration(String.format("%.1f", Math.max(0, 3.2 - (minutesElapsed / 60.0))));
        b.setProgress(progress);
        b.setVelocity(String.valueOf(currentVelocity));
        b.setEnergy(energyLeft);
    }

    // --- AUTHORIZATION LOGIC ---

    @PutMapping("/bookings/approve/{id}")
    public ResponseEntity<?> approveBooking(@PathVariable String id) {
        try {
            Long numericId = Long.parseLong(id.contains(":") ? id.split(":")[0] : id);
            Optional<Booking> booking = bookingRepository.findById(numericId);

            if (booking.isPresent()) {
                Booking b = booking.get();
                b.setStatus("APPROVED");
                b.setDistance("248.25");
                b.setDuration("3.2");
                b.setProgress(0);
                b.setEnergy(100);
                bookingRepository.save(b);
                return ResponseEntity.ok(Map.of("message", "BOOKING_AUTHORIZED", "status", "success"));
            }
            return ResponseEntity.status(404).body(Map.of("message", "ID not found"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "ERROR"));
        }
    }

    // --- BOOKING WORKFLOW ---

    @PostMapping("/bookings/create")
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        booking.setStatus("PENDING");
        booking.setDistance("248.25");
        booking.setDuration("3.2");
        booking.setProgress(0);
        booking.setEnergy(100);
        booking.setVelocity("0");
        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.ok(Map.of("message", "SYNC_INITIALIZED", "id", saved.getId()));
    }

    @PutMapping("/driver/trip/status/{userId}")
    public ResponseEntity<?> confirmPickup(@PathVariable String userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        Optional<Booking> target = bookings.stream()
                .filter(b -> "APPROVED".equals(b.getStatus()))
                .findFirst();

        if (target.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "NOT_FOUND"));

        Booking b = target.get();
        b.setStatus("TRIP_ACTIVE");
        b.setBookingTime(LocalDateTime.now()); // Mark start time for the clock
        bookingRepository.save(b);
        return ResponseEntity.ok(Map.of("message", "TRIP_ACTIVE", "status", "TRIP_ACTIVE"));
    }

    @PutMapping("/driver/trip/drop/{userId}")
    public ResponseEntity<?> completeTrip(@PathVariable String userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        Optional<Booking> active = bookings.stream()
                .filter(b -> "TRIP_ACTIVE".equals(b.getStatus()))
                .findFirst();

        if (active.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "NO_ACTIVE_TRIP"));

        Booking current = active.get();

        // Before deleting, simulate metrics one last time to get final values
        simulateLiveMetrics(current);

        // Save to History
        TripHistory history = new TripHistory();
        history.setUserId(current.getUserId());
        history.setVehicleModel(current.getVehicleModel());
        history.setPickupLocation(current.getPickupLocation());
        history.setDropLocation(current.getDropLocation());
        history.setDistance("248.25"); // Log total distance
        history.setDuration("3.2");
        history.setCompletedAt(LocalDateTime.now());

        tripHistoryRepository.save(history);
        bookingRepository.delete(current);

        return ResponseEntity.ok(Map.of("message", "NODE_RELEASED", "status", "SUCCESS"));
    }

    // --- DASHBOARD ANALYTICS ---

    @GetMapping("/bookings/stats")
    public ResponseEntity<?> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", bookingRepository.count());
        stats.put("pending", bookingRepository.countByStatus("PENDING"));
        stats.put("active", bookingRepository.countByStatus("TRIP_ACTIVE"));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/bookings/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @GetMapping("/driver/trips/history/{userId}")
    public ResponseEntity<List<TripHistory>> getHistory(@PathVariable String userId) {
        return ResponseEntity.ok(tripHistoryRepository.findByUserIdOrderByCompletedAtDesc(userId));
    }
}