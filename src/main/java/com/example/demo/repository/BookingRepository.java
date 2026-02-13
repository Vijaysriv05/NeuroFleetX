package com.example.demo.repository;

import com.example.demo.entity.Booking;
import com.example.demo.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Finds all bookings associated with a specific driver/user
    List<Booking> findByUserId(String userId);

    // Used to filter bookings by their current state (PENDING, APPROVED, TRIP_ACTIVE)
    List<Booking> findByStatus(String status);

    /** * FIX: Resolves errors in AuthController or AdminController
     * when calculating dashboard statistics.
     */
    long countByStatus(String status);
}