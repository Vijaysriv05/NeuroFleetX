package com.example.demo.service;

import com.example.demo.repository.CustomerVehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleRequestService {

    @Autowired
    private CustomerVehicleRepository customerVehicleRepository;

    /**
     * Purges a link between a user and a vehicle (Pending or Rejected).
     * @param id The primary key (ID) from the customer_vehicle table.
     */
    @Transactional
    public void removeRequest(Long id) {
        if (customerVehicleRepository.existsById(id)) {
            customerVehicleRepository.deleteById(id);
        } else {
            throw new RuntimeException("Request record not found for ID: " + id);
        }
    }
}