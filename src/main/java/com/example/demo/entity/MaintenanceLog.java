package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_logs")
public class MaintenanceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long vehicleId;
    private String model;
    private String operatorName;
    private String issueDescription;
    private String status;

    // These fields fix the "cannot find symbol" errors
    private Double distanceAtService;
    private String statusBefore;
    private LocalDateTime reportDate = LocalDateTime.now();
    private LocalDateTime serviceTimestamp = LocalDateTime.now();

    // --- GETTERS AND SETTERS ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }
    public String getIssueDescription() { return issueDescription; }
    public void setIssueDescription(String issueDescription) { this.issueDescription = issueDescription; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getDistanceAtService() { return distanceAtService; }
    public void setDistanceAtService(Double distanceAtService) { this.distanceAtService = distanceAtService; }
    public String getStatusBefore() { return statusBefore; }
    public void setStatusBefore(String statusBefore) { this.statusBefore = statusBefore; }
    public LocalDateTime getReportDate() { return reportDate; }
    public void setReportDate(LocalDateTime reportDate) { this.reportDate = reportDate; }
    public LocalDateTime getServiceTimestamp() { return serviceTimestamp; }
    public void setServiceTimestamp(LocalDateTime serviceTimestamp) { this.serviceTimestamp = serviceTimestamp; }
}