package com.mpc.admin.web.dto;

public class AdminDashboardDTO {
    private long totalUsers;
    private long totalAnalyses;
    private long totalReports;
    private double averageROI;
    private double totalAnnualGeneration;
    private double totalCo2Reduction;
    private long activeUsersThisMonth;

    public AdminDashboardDTO(long totalUsers, long totalAnalyses, long totalReports, 
                             double averageROI, double totalAnnualGeneration, 
                             double totalCo2Reduction, long activeUsersThisMonth) {
        this.totalUsers = totalUsers;
        this.totalAnalyses = totalAnalyses;
        this.totalReports = totalReports;
        this.averageROI = averageROI;
        this.totalAnnualGeneration = totalAnnualGeneration;
        this.totalCo2Reduction = totalCo2Reduction;
        this.activeUsersThisMonth = activeUsersThisMonth;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalAnalyses() {
        return totalAnalyses;
    }

    public void setTotalAnalyses(long totalAnalyses) {
        this.totalAnalyses = totalAnalyses;
    }

    public long getTotalReports() {
        return totalReports;
    }

    public void setTotalReports(long totalReports) {
        this.totalReports = totalReports;
    }

    public double getAverageROI() {
        return averageROI;
    }

    public void setAverageROI(double averageROI) {
        this.averageROI = averageROI;
    }

    public double getTotalAnnualGeneration() {
        return totalAnnualGeneration;
    }

    public void setTotalAnnualGeneration(double totalAnnualGeneration) {
        this.totalAnnualGeneration = totalAnnualGeneration;
    }

    public double getTotalCo2Reduction() {
        return totalCo2Reduction;
    }

    public void setTotalCo2Reduction(double totalCo2Reduction) {
        this.totalCo2Reduction = totalCo2Reduction;
    }

    public long getActiveUsersThisMonth() {
        return activeUsersThisMonth;
    }

    public void setActiveUsersThisMonth(long activeUsersThisMonth) {
        this.activeUsersThisMonth = activeUsersThisMonth;
    }
}
