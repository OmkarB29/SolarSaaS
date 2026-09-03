package com.mpc.admin.web;

import com.mpc.admin.service.AdminService;
import com.mpc.admin.web.dto.AdminAnalyticsDTO;
import com.mpc.admin.web.dto.AdminDashboardDTO;
import com.mpc.admin.web.dto.AdminUserDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboard() {
        AdminDashboardDTO dashboard = adminService.getDashboardStats();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getUsers() {
        List<AdminUserDTO> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDTO> getAnalytics() {
        AdminAnalyticsDTO analytics = adminService.getAnalyticsTrends();
        return ResponseEntity.ok(analytics);
    }
}
