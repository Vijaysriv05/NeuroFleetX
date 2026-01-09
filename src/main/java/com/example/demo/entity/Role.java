package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roleId;

    @Column(name = "role_name", nullable = false, unique = true)
    private String roleName;

    // Default constructor
    public Role() {}

    // Constructor with roleName
    public Role(String roleName) {
        this.roleName = roleName;
    }

    // -------- Getters --------
    public Integer getRoleId() { return roleId; }
    public String getRoleName() { return roleName; }

    // -------- Setters --------
    public void setRoleId(Integer roleId) { this.roleId = roleId; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}

