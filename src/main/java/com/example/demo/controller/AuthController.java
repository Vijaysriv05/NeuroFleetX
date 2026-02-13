package com.example.demo.controller;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.example.demo.entity.Feedback;
import com.example.demo.repository.FeedbackRepository;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import com.example.demo.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.example.demo.entity.MaintenanceLog;
import com.example.demo.repository.MaintenanceLogRepository;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.example.demo.service.VehicleRequestService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerVehicleRepository customerVehicleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final BookingRepository bookingRepository; // Add this line


    @Autowired
    private VehicleRequestService vehicleRequestService;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private MaintenanceLogRepository maintenanceLogRepository;

    @Autowired
    public AuthController(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            VehicleRepository vehicleRepository,
            CustomerVehicleRepository customerVehicleRepository,
            BookingRepository bookingRepository,
            AuditLogRepository auditLogRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.vehicleRepository = vehicleRepository;
        this.customerVehicleRepository = customerVehicleRepository;
        this.auditLogRepository = auditLogRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // --- 0. HELPER METHOD ---
    private Long parseCleanId(String userId) {
        if (userId == null) return 0L;
        // Specifically handles the "ID:Role" format (12:1) from your console
        String cleanId = userId.split(":")[0].replaceAll("[^0-9]", "");
        return cleanId.isEmpty() ? 0L : Long.parseLong(cleanId);
    }
    // --- 1. AUTHENTICATION & IDENTITY ---
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User already exists", "status", "error"));
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("PENDING");
        userRepository.save(user);

        UserProfile profile = new UserProfile();
        profile.setName(user.getUsername());
        profile.setEmail(user.getEmail());
        profile.setRoleId(user.getRoleId());
        profile.setPhone(user.getPhone() != null ? user.getPhone() : "");
        profile.setAddress(user.getAddress() != null ? user.getAddress() : "");
        profile.setStatus("PENDING");
        userProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of("message", "Registered successfully", "status", "success"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail().trim());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Email not found", "status", "error"));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("message", "Incorrect password", "status", "error"));
        }

        if (loginRequest.getRoleId() != null && !loginRequest.getRoleId().equals(user.getRoleId())) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", "Access Denied: Invalid role selected",
                    "status", "error"
            ));
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "roleId", user.getRoleId(),
                "userId", user.getUserId(),
                "email", user.getEmail(),
                "message", "Login Successful",
                "status", "success"
        ));
    }

    // --- 2. PROFILE MANAGEMENT ---
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();
        Optional<UserProfile> profileOpt = userProfileRepository.findByEmail(email);

        if (profileOpt.isPresent()) {
            return ResponseEntity.ok(profileOpt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Profile not found"));
        }
    }

    @PutMapping("/profile/update")
    public ResponseEntity<?> updateProfile(@RequestBody UserProfile updatedProfile, Authentication authentication) {
        String email = authentication.getName();
        Optional<UserProfile> profileOpt = userProfileRepository.findByEmail(email);

        if (profileOpt.isPresent()) {
            UserProfile profile = profileOpt.get();
            profile.setName(updatedProfile.getName());
            profile.setPhone(updatedProfile.getPhone());
            profile.setAddress(updatedProfile.getAddress());
            userProfileRepository.save(profile);
            return ResponseEntity.ok(Map.of("message", "Profile updated", "status", "success"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Profile Not Found"));
    }

    // --- 3. DASHBOARD & QUEUE MANAGEMENT ---
    @DeleteMapping("/vehicles/request/{id}")
    public ResponseEntity<?> deleteVehicleRequest(@PathVariable Long id) {
        try {
            if (customerVehicleRepository.existsById(id)) {
                customerVehicleRepository.deleteById(id);
                return ResponseEntity.ok(Map.of("message", "Log entry purged", "status", "success"));
            }
            return ResponseEntity.ok().body(Map.of("message", "Local log cleared", "status", "success"));
        } catch (Exception e) {
            return ResponseEntity.ok().body(Map.of("message", "Local log cleared (Handshake Sync)", "status", "success"));
        }
    }

    @PutMapping("/customer/vehicles/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable("id") Integer id, @RequestBody Vehicle details) {
        return vehicleRepository.findById(Long.valueOf(id)).map(v -> {
            if (details.getStatus() != null) v.setStatus(details.getStatus());
            if (details.getVehicleCondition() != null) v.setVehicleCondition(details.getVehicleCondition());
            if (details.getSpeed() != null) v.setSpeed(details.getSpeed());
            if (details.getFuel() != null) v.setFuel(details.getFuel());
            vehicleRepository.save(v);
            return ResponseEntity.ok(Map.of("message", "Telemetry synced", "status", "success"));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Vehicle not found")));
    }

    @DeleteMapping("/customer/vehicles/{id}")
    public ResponseEntity<?> deleteMasterVehicle(@PathVariable("id") Integer id) {
        try {
            if (vehicleRepository.existsById(id.longValue())) {
                vehicleRepository.deleteById(id.longValue());
                return ResponseEntity.ok(Map.of("message", "UNIT_DECOMMISSIONED", "status", "success"));
            }
            return ResponseEntity.status(404).body(Map.of("message", "Vehicle not found in master"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Deletion failed: " + e.getMessage()));
        }
    }

    // --- 4. CUSTOMER FLEET & REQUESTS ---
    @PostMapping("/vehicles/add")
    public ResponseEntity<?> addVehicle(@RequestBody Vehicle vehicle) {
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(Map.of("message", "Vehicle added to Master Fleet!", "id", savedVehicle.getId(), "status", "success"));
    }

    @PostMapping("/vehicles/register")
    public ResponseEntity<?> registerVehicle(@RequestBody CustomerVehicle request) {
        try {
            if (request.getStatus() == null) {
                request.setStatus("pending");
            }
            List<CustomerVehicle> existing = customerVehicleRepository.findByUserId(request.getUserId());
            boolean alreadyExists = existing.stream().anyMatch(v -> v.getVehicleId().equals(request.getVehicleId()));

            if (alreadyExists) {
                return ResponseEntity.badRequest().body(Map.of("message", "Node already linked or pending authorization"));
            }

            vehicleRepository.findById(request.getVehicleId().longValue())
                    .ifPresent(m -> request.setVehicleModel(m.getModel()));

            customerVehicleRepository.save(request);
            return ResponseEntity.ok(Map.of("message", "System awaiting admin handshake", "status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Uplink failure: " + e.getMessage()));
        }
    }

    @GetMapping("/vehicles/my-fleet/{userId}")
    public ResponseEntity<?> getCustomerFleet(@PathVariable Long userId) {
        try {
            List<CustomerVehicle> fleet = customerVehicleRepository.findByUserId(userId);
            return ResponseEntity.ok(fleet != null ? fleet : Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching fleet: " + e.getMessage());
        }
    }

    @DeleteMapping("/vehicles/register/{id}")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long id) {
        try {
            if (customerVehicleRepository.existsById(id)) {
                customerVehicleRepository.deleteById(id);
                return ResponseEntity.ok(Map.of("message", "Uplink Terminated", "status", "success"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Registration link not found"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Termination failure: " + e.getMessage()));
        }
    }

    // --- 5. ADMIN VEHICLE APPROVAL ---
    @GetMapping("/admin/vehicles/pending")
    public ResponseEntity<List<CustomerVehicle>> getPendingApprovals() {
        return ResponseEntity.ok(customerVehicleRepository.findByStatus("pending"));
    }

    // Fixes the AUTHORIZATION_SYNC_ERROR in image_7c8dfd.png
    @PutMapping("/admin/approve/{id}")
    public ResponseEntity<?> approveAssetSync(@PathVariable Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("APPROVED");
            bookingRepository.save(booking);
            return ResponseEntity.ok(Map.of("message", "AUTHORIZED_SUCCESSFULLY"));
        }).orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/admin/vehicles/reject/{id}")
    public ResponseEntity<?> rejectVehicle(@PathVariable Long id) {
        try {
            CustomerVehicle v = customerVehicleRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("REJECTION_TARGET_NOT_FOUND"));

            v.setStatus("rejected");
            customerVehicleRepository.save(v);
            saveAuditLog(v.getVehicleModel(), "REJECTED_BY_ADMIN");

            return ResponseEntity.ok(Map.of("message", "REJECTED_SUCCESSFULLY", "status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "SYNC_ERROR: " + e.getMessage()));
        }
    }

    // --- 6. GLOBAL FEEDBACK ---
    @PostMapping("/feedback/submit")
    public ResponseEntity<?> submitFeedback(@RequestBody Feedback feedback) {
        try {
            feedback.setTimestamp(LocalDateTime.now());
            feedbackRepository.save(feedback);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "FEEDBACK_BROADCAST_COMPLETE"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "SYNC_FAILURE"));
        }
    }

    @GetMapping("/feedback/all")
    public ResponseEntity<List<Feedback>> getAllFeedback() {
        return ResponseEntity.ok(feedbackRepository.findAllByOrderByTimestampDesc());
    }

    @DeleteMapping("/feedback/{id}")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long id) {
        return feedbackRepository.findById(id)
                .map(f -> {
                    feedbackRepository.delete(f);
                    return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "PURGED"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // --- 7. DASHBOARD TELEMETRY & FLEET STATUS ---
    @GetMapping({"/driver/trip-data/{userId:.+}", "/driver/trip-data/{userId}"})
    public ResponseEntity<?> getDriverTripData(@PathVariable String userId) {
        Long cleanId = parseCleanId(userId);

        return customerVehicleRepository.findByUserId(cleanId).stream()
                .filter(cv -> !cv.getStatus().equalsIgnoreCase("idle") && !cv.getStatus().equalsIgnoreCase("rejected"))
                .findFirst()
                .map(link -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("status", link.getStatus());

                    vehicleRepository.findById(link.getVehicleId().longValue()).ifPresent(v -> {
                        response.put("vehicleInfo", v);
                    });

                    response.put("customerDetails", Map.of(
                            "name", "Mission Objective Alpha",
                            "phone", "+91 98XXX XXXXX"
                    ));
                    response.put("tripDetails", Map.of(
                            "pickupLocation", "Sector 7G",
                            "dropLocation", "Central Command"
                    ));

                    return ResponseEntity.ok((Object) response);
                })
                .orElse(ResponseEntity.ok(Map.of("status", "IDLE")));
    }

    // --- 8. EMERGENCY SOS ---
    @PostMapping("/driver/emergency/{userId}")
    public ResponseEntity<?> triggerEmergency(@PathVariable String userId) {
        Long cleanId = parseCleanId(userId);
        Optional<CustomerVehicle> linkOpt = customerVehicleRepository.findByUserId(cleanId).stream()
                .filter(cv -> Arrays.asList("approved", "pickup_completed").contains(cv.getStatus()))
                .findFirst();

        if (linkOpt.isPresent()) {
            vehicleRepository.findById(linkOpt.get().getVehicleId().longValue()).ifPresent(v -> {
                v.setVehicleCondition("CRITICAL");
                v.setSpeed(0.0);
                v.setStatus("EMERGENCY_STOP");
                vehicleRepository.save(v);
                saveAuditLog(v.getModel(), "EMERGENCY_SOS_BY_DRIVER_" + cleanId);
            });
            return ResponseEntity.ok(Map.of("message", "SOS_BROADCAST_ACTIVE", "status", "success"));
        }
        return ResponseEntity.ok(Map.of("message", "SOS_LOGGED_OFFLINE", "status", "warning"));
    }

    @DeleteMapping("/driver/trip/terminate/{userId}")
    public ResponseEntity<?> terminateSession(@PathVariable Long userId) {
        List<CustomerVehicle> registrations = customerVehicleRepository.findByUserId(userId);

        Optional<CustomerVehicle> activeLink = registrations.stream()
                .filter(cv -> !cv.getStatus().equalsIgnoreCase("rejected"))
                .findFirst();

        if (activeLink.isPresent()) {
            customerVehicleRepository.delete(activeLink.get());
            return ResponseEntity.ok(Map.of("message", "SESSION_TERMINATED_SUCCESSFULLY"));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("NO_ACTIVE_SESSION_TO_TERMINATE");
    }

    // --- 9. DYNAMIC MAINTENANCE REQUEST ---
    @PostMapping("/driver/maintenance/{userId}")
    public ResponseEntity<?> reportMaintenance(@PathVariable String userId, @RequestBody Map<String, String> request) {
        try {
            Long cleanId = parseCleanId(userId);
            String issue = request.get("issue");
            System.out.println("LOG: Maintenance Report for User " + cleanId + ": " + issue);

            List<CustomerVehicle> links = customerVehicleRepository.findByUserId(cleanId);

            Optional<CustomerVehicle> activeLink = links.stream()
                    .filter(cv -> "approved".equalsIgnoreCase(cv.getStatus()) ||
                            "pickup_completed".equalsIgnoreCase(cv.getStatus()))
                    .findFirst();

            if (activeLink.isPresent()) {
                CustomerVehicle link = activeLink.get();
// Convert to Long using .longValue() to match the Repository type
                Optional<Vehicle> vOpt = vehicleRepository.findById(link.getVehicleId().longValue());

                if (vOpt.isPresent()) {
                    Vehicle v = vOpt.get();
                    v.setVehicleCondition("NEEDS_SERVICE");
                    vehicleRepository.save(v);

                    link.setStatus("maintenance_pending");
                    link.setMaintenanceIssue(issue);
                    customerVehicleRepository.save(link);

                    saveAuditLog(v.getModel(), "MAINTENANCE_REPORTED: " + issue);
                    return ResponseEntity.ok(Map.of("message", "REPORT_LOGGED_FOR_MANAGER", "status", "success"));
                }
            }
            return ResponseEntity.status(404).body(Map.of("message", "NO_ACTIVE_UPLINK_FOUND"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "MAINTENANCE_SYNC_FAILURE"));
        }
    }

    // --- 10. ADMIN USER/DRIVER MANAGEMENT ---
    @GetMapping({"/admin/drivers/all", "/admin/users/all"})
    public ResponseEntity<List<UserProfile>> getAllUsers() {
        return ResponseEntity.ok(userProfileRepository.findAll());
    }

    @GetMapping({"/admin/drivers/pending", "/admin/users/pending"})
    public ResponseEntity<List<UserProfile>> getPendingUsers() {
        return ResponseEntity.ok(userProfileRepository.findByStatus("PENDING"));
    }

    @GetMapping({"/admin/drivers/rejected", "/admin/users/rejected"})
    public ResponseEntity<List<UserProfile>> getRejectedUsers() {
        return ResponseEntity.ok(userProfileRepository.findByStatus("REJECTED"));
    }

    @PutMapping({"/admin/drivers/reject/{id}", "/admin/users/reject/{id}"})
    public ResponseEntity<?> adminRejectUser(@PathVariable Long id) {
        Optional<UserProfile> profileOpt = userProfileRepository.findById(id);
        if(profileOpt.isPresent()){
            UserProfile profile = profileOpt.get();
            profile.setStatus("REJECTED");
            userProfileRepository.save(profile);

            userRepository.findByEmail(profile.getEmail()).ifPresent(user -> {
                user.setRole("REJECTED");
                userRepository.save(user);
            });

            saveAuditLog("USER_SYSTEM", "USER_ID_" + id + "_REJECTED");
            return ResponseEntity.ok(Map.of("message", "USER_REJECTED", "status", "success"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping({"/admin/drivers/approve/{id}", "/admin/users/approve/{id}"})
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        Optional<UserProfile> profileOpt = userProfileRepository.findById(id);
        if(profileOpt.isPresent()){
            UserProfile profile = profileOpt.get();
            profile.setStatus("APPROVED");
            userProfileRepository.save(profile);

            userRepository.findByEmail(profile.getEmail()).ifPresent(user -> {
                user.setRole("APPROVED");
                userRepository.save(user);
            });

            saveAuditLog("USER_SYSTEM", "USER_ID_" + id + "_APPROVED");
            return ResponseEntity.ok(Map.of("message", "USER_AUTHORIZED", "status", "success"));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping({"/admin/drivers/{id}", "/admin/users/{id}"})
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<UserProfile> profileOpt = userProfileRepository.findById(id);
            if (profileOpt.isPresent()) {
                UserProfile profile = profileOpt.get();
                String email = profile.getEmail();

                userProfileRepository.deleteById(id);
                userRepository.findByEmail(email).ifPresent(userRepository::delete);

                saveAuditLog("USER_SYSTEM", "USER_PURGED: " + email);
                return ResponseEntity.ok(Map.of("message", "USER_DELETED", "status", "success"));
            }
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Deletion failed: " + e.getMessage()));
        }
    }



   /* @GetMapping("/vehicles/stats")
    public ResponseEntity<?> getVehicleStats() {
        return ResponseEntity.ok(Map.of(
                "totalVehicles", vehicleRepository.count(),
                "activeTrips", vehicleRepository.countTotalActiveDeploy()
        ));
    }*/

    // --- 11. MANAGER DASHBOARD ---
    @GetMapping({"/manager/active-requests", "/manager/driver-requests"})
    public ResponseEntity<?> getManagerActiveRequests() {
        try {
            List<String> alertStatuses = Arrays.asList("maintenance_pending", "SOS_ACTIVE");
            List<CustomerVehicle> requests = customerVehicleRepository.findAll().stream()
                    .filter(cv -> alertStatuses.contains(cv.getStatus()))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching requests");
        }
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/vehicles/master/{id}")
    public ResponseEntity<?> getVehicleById(@PathVariable Integer id) {
        return vehicleRepository.findById(id.longValue()) // Removed semicolon here
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/vehicles/all")
    public ResponseEntity<List<CustomerVehicle>> getAllCustomerLinks() {
        return ResponseEntity.ok(customerVehicleRepository.findAll());
    }

    @PutMapping("/vehicles/authorize-service/{id}")
    public ResponseEntity<?> authorizeService(@PathVariable Integer id, Authentication auth) {
        return vehicleRepository.findById(id.longValue()).map(v -> {
            // ... rest of your code
            MaintenanceLog log = new MaintenanceLog();
            log.setVehicleId(v.getId().longValue());
            log.setModel(v.getModel());
            log.setOperatorName(auth.getName());
            log.setDistanceAtService(v.getTotalDistance());
            log.setStatusBefore(v.getVehicleCondition());
            maintenanceLogRepository.save(log);

            v.setTotalDistance(0.0);
            v.setVehicleCondition("OPTIMAL");
            v.setStatus("AVAILABLE");
            vehicleRepository.save(v);

            customerVehicleRepository.findAll().stream()
                    .filter(cv -> cv.getVehicleId().equals(v.getId().longValue()))
                    .forEach(cv -> {
                        cv.setStatus("approved");
                        cv.setMaintenanceIssue(null);
                        customerVehicleRepository.save(cv);
                    });

            return ResponseEntity.ok(Map.of("status", "success", "message", "SERVICE_LOGGED_AND_RESET"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/manager/maintenance-history")
    public ResponseEntity<List<MaintenanceLog>> getHistory() {
        return ResponseEntity.ok(maintenanceLogRepository.findAllByOrderByServiceTimestampDesc());
    }

    // --- 12. NEURAL REDISTRIBUTION ---
    @PostMapping("/redistribute")
    public ResponseEntity<?> redistributeVehiclesDirect(@RequestBody Map<String, Object> payload) {
        return processRedistribution(payload);
    }

    private ResponseEntity<?> processRedistribution(Map<String, Object> payload) {
        try {
            String fromSector = (String) payload.get("fromSector");
            String toSector = (String) payload.get("toSector");
            int unitCount = Integer.parseInt(payload.get("unitCount").toString());

            Pageable limit = PageRequest.of(0, unitCount);

            List<Vehicle> unitsToMove = vehicleRepository.findTopNByLocationAndStatus(
                    fromSector, "AVAILABLE", limit
            );

            if (unitsToMove.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "NO_AVAILABLE_UNITS_IN_" + fromSector));
            }

            for (Vehicle vehicle : unitsToMove) {
                vehicle.setLocation(toSector);
                vehicle.setSpeed(0.0);
            }

            vehicleRepository.saveAll(unitsToMove);

            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "NEURAL_REDISTRIBUTION_COMPLETE",
                    "movedUnits", unitsToMove.size(),
                    "origin", fromSector,
                    "destination", toSector
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "SYSTEM_SYNC_FAILURE: " + e.getMessage()));
        }
    }

    // --- 13. TRIP LIFECYCLE ---
   /* @PutMapping({"/driver/trip/status/{id:.+}", "/driver/trip/status/{id}"})
    public ResponseEntity<?> confirmPickup(@PathVariable String id) {
        Long cleanId = parseCleanId(id);
        return customerVehicleRepository.findByUserId(cleanId).stream()
                .filter(cv -> "approved".equalsIgnoreCase(cv.getStatus())).findFirst()
                .map(link -> {
                    link.setStatus("pickup_completed");
                    customerVehicleRepository.save(link);
                    vehicleRepository.findById(link.getVehicleId().intValue()).ifPresent(v -> {
                        v.setStatus("IN_USE");
                        vehicleRepository.save(v);
                        saveAuditLog(v.getModel(), "PICKUP_CONFIRMED_BY_OPERATOR_" + cleanId);
                    });
                    return ResponseEntity.ok(Map.of("message", "PICKUP_COMPLETED", "status", "success"));
                }).orElse(ResponseEntity.status(404).body(Map.of("message", "NO_ACTIVE_LINK")));
    }

    @Transactional
    @PutMapping({"/driver/trip/drop/{id:.+}", "/driver/trip/drop/{id}"})
    public ResponseEntity<?> confirmDrop(@PathVariable String id) {
        Long cleanId = parseCleanId(id);
        List<CustomerVehicle> activeLinks = customerVehicleRepository.findByUserId(cleanId);

        if (activeLinks.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "NO_ACTIVE_TRIP_FOUND"));
        }

        CustomerVehicle link = activeLinks.get(0);
        vehicleRepository.findById(link.getVehicleId().intValue()).ifPresent(v -> {
            v.setStatus("AVAILABLE");
            v.setSpeed(0.0);
            vehicleRepository.save(v);
            saveAuditLog(v.getModel(), "TRIP_COMPLETED_BY_" + cleanId);
        });

        customerVehicleRepository.delete(link);
        return ResponseEntity.ok(Map.of("status", "success", "message", "DROP_COMPLETED"));
    }



    // In an AuditController.java
    @GetMapping("/api/admin/logs")
    public ResponseEntity<List<AuditLog>> getLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());*/
   // }
    // --- 14. DRIVER HISTORY & LOGS ENDPOINTS ---
  /*  @GetMapping("/driver/trips/history/{userId}")
    public ResponseEntity<?> getDriverTripHistory(@PathVariable String userId) {
        Long cleanId = parseCleanId(userId);

        List<Map<String, Object>> history = auditLogRepository.findAll().stream()
                .filter(log -> log.getActionType() != null && log.getActionType().contains("TRIP_COMPLETED_BY_" + cleanId))
                .map(log -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("pickupLocation", "Sector 7G");
                    map.put("dropLocation", "Central Command");
                    map.put("completedAt", log.getTimestamp());
                    map.put("vehicleModel", log.getVehicleModel());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(history);
    }*/

  /*  @GetMapping("/driver/logs/{userId}")
    public ResponseEntity<?> getDriverSystemLogs(@PathVariable String userId) {
        Long cleanId = parseCleanId(userId);

        List<Map<String, Object>> logs = auditLogRepository.findAll().stream()
                .filter(log -> log.getActionType() != null && log.getActionType().contains("_" + cleanId))
                .map(log -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("type", log.getActionType().contains("SOS") ? "SOS" : "SYSTEM");
                    map.put("description", log.getActionType().split("_" + cleanId)[0].replace("_", " "));
                    map.put("timestamp", log.getTimestamp());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(logs);
    }*/

    // AuthController.java
    @GetMapping("/vehicles/stats")
    public ResponseEntity<?> getVehicleStats() {
        return ResponseEntity.ok(Map.of(
                "totalVehicles", bookingRepository.count(), // This uses the 10 rows you have
                "activeTrips", bookingRepository.countByStatus("PENDING"),
                "systemLoad", 25,
                "iotStatus", "ONLINE"
        ));
    }


    // --- 15. PURGE DRIVER LOGS ---
    @Transactional
    @DeleteMapping("/driver/logs/clear/{userId:.+}")
    public ResponseEntity<?> clearDriverLogs(@PathVariable String userId) {
        try {
            Long cleanId = parseCleanId(userId);
            List<AuditLog> driverLogs = auditLogRepository.findAll().stream()
                    .filter(log -> log.getActionType() != null && log.getActionType().contains("_" + cleanId))
                    .collect(Collectors.toList());

            if (!driverLogs.isEmpty()) {
                auditLogRepository.deleteAll(driverLogs);
                saveAuditLog("SYSTEM_CLEANSE", "LOG_HISTORY_PURGED_BY_USER_" + cleanId);
            }
            return ResponseEntity.ok(Map.of("status", "success", "message", "PURGE_COMPLETE"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("NeuroFleet Core Online ✅");
    }

    @GetMapping("/vehicles/master")
    public ResponseEntity<List<Vehicle>> getMasterList() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }
    // --- UTILS & STATS ---
    public void saveAuditLog(String model, String action) {
        AuditLog log = new AuditLog();
        log.setVehicleModel(model != null ? model : "UNKNOWN_NODE");
        log.setActionType(action);
        log.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    @GetMapping("/admin/logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByTimestampDesc());
    }
}
