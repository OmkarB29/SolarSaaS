package com.mpc.admin.web.dto;

public class AdminDashboardDTO {
    private long totalUsers;
    private long totalAnalyses;
    private long totalReports;
    private double averageROI;
    private double totalAnnualGeneration;
    private double totalCo2Reduction;
    private long activeUsersThisMonth;
    private long totalProposals;
    private long proposalsApproved;
    private double approvalRate;
    private long proposalsInstalled;
    private double installationRate;

    // Solar Potential Module Analytics
    private long totalSolarAnalyses;
    private double averageSolarScore;
    private double highestEnergyRooftop;
    private double totalSolarAnnualEnergy;
    private double totalSolarCarbonOffset;
    private double totalSavingsPotential;
    private double highestRatedRooftop;
    private java.util.List<com.mpc.solar.web.dto.SolarPotentialDTO> recentSolarAnalyses = new java.util.ArrayList<>();

    // AI Recommendation Analytics
    private long totalAIRecommendations;
    private double averageAISolarScore;
    private long lowRiskProjectsCount;
    private long mediumRiskProjectsCount;
    private long highRiskProjectsCount;
    private String mostCommonRecommendation;
    private java.util.List<com.mpc.ai.web.dto.AIRecommendationDTO> recentAIRecommendations = new java.util.ArrayList<>();

    // Panel Optimization Analytics
    private long totalOptimizedLayouts;
    private double averageOptimizationScore;
    private double averageRoofUtilization;
    private double totalCapacityPlanned;
    private String mostSelectedLayoutMode;
    private java.util.List<com.mpc.paneloptimizer.web.dto.PanelLayoutDTO> recentOptimizations = new java.util.ArrayList<>();

    public AdminDashboardDTO() {
    }

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

    public AdminDashboardDTO(long totalUsers, long totalAnalyses, long totalReports, 
                             double averageROI, double totalAnnualGeneration, 
                             double totalCo2Reduction, long activeUsersThisMonth,
                             long totalProposals, long proposalsApproved, double approvalRate,
                             long proposalsInstalled, double installationRate) {
        this.totalUsers = totalUsers;
        this.totalAnalyses = totalAnalyses;
        this.totalReports = totalReports;
        this.averageROI = averageROI;
        this.totalAnnualGeneration = totalAnnualGeneration;
        this.totalCo2Reduction = totalCo2Reduction;
        this.activeUsersThisMonth = activeUsersThisMonth;
        this.totalProposals = totalProposals;
        this.proposalsApproved = proposalsApproved;
        this.approvalRate = approvalRate;
        this.proposalsInstalled = proposalsInstalled;
        this.installationRate = installationRate;
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

    public long getTotalProposals() {
        return totalProposals;
    }

    public void setTotalProposals(long totalProposals) {
        this.totalProposals = totalProposals;
    }

    public long getProposalsApproved() {
        return proposalsApproved;
    }

    public void setProposalsApproved(long proposalsApproved) {
        this.proposalsApproved = proposalsApproved;
    }

    public double getApprovalRate() {
        return approvalRate;
    }

    public void setApprovalRate(double approvalRate) {
        this.approvalRate = approvalRate;
    }

    public long getProposalsInstalled() {
        return proposalsInstalled;
    }

    public void setProposalsInstalled(long proposalsInstalled) {
        this.proposalsInstalled = proposalsInstalled;
    }

    public double getInstallationRate() {
        return installationRate;
    }

    public void setInstallationRate(double installationRate) {
        this.installationRate = installationRate;
    }

    public long getTotalSolarAnalyses() {
        return totalSolarAnalyses;
    }

    public void setTotalSolarAnalyses(long totalSolarAnalyses) {
        this.totalSolarAnalyses = totalSolarAnalyses;
    }

    public double getAverageSolarScore() {
        return averageSolarScore;
    }

    public void setAverageSolarScore(double averageSolarScore) {
        this.averageSolarScore = averageSolarScore;
    }

    public double getHighestEnergyRooftop() {
        return highestEnergyRooftop;
    }

    public void setHighestEnergyRooftop(double highestEnergyRooftop) {
        this.highestEnergyRooftop = highestEnergyRooftop;
    }

    public double getTotalSolarAnnualEnergy() {
        return totalSolarAnnualEnergy;
    }

    public void setTotalSolarAnnualEnergy(double totalSolarAnnualEnergy) {
        this.totalSolarAnnualEnergy = totalSolarAnnualEnergy;
    }

    public double getTotalSolarCarbonOffset() {
        return totalSolarCarbonOffset;
    }

    public void setTotalSolarCarbonOffset(double totalSolarCarbonOffset) {
        this.totalSolarCarbonOffset = totalSolarCarbonOffset;
    }

    public double getTotalSavingsPotential() {
        return totalSavingsPotential;
    }

    public void setTotalSavingsPotential(double totalSavingsPotential) {
        this.totalSavingsPotential = totalSavingsPotential;
    }

    public double getHighestRatedRooftop() {
        return highestRatedRooftop;
    }

    public void setHighestRatedRooftop(double highestRatedRooftop) {
        this.highestRatedRooftop = highestRatedRooftop;
    }

    public java.util.List<com.mpc.solar.web.dto.SolarPotentialDTO> getRecentSolarAnalyses() {
        return recentSolarAnalyses;
    }

    public void setRecentSolarAnalyses(java.util.List<com.mpc.solar.web.dto.SolarPotentialDTO> recentSolarAnalyses) {
        this.recentSolarAnalyses = recentSolarAnalyses;
    }

    public long getTotalAIRecommendations() {
        return totalAIRecommendations;
    }

    public void setTotalAIRecommendations(long totalAIRecommendations) {
        this.totalAIRecommendations = totalAIRecommendations;
    }

    public double getAverageAISolarScore() {
        return averageAISolarScore;
    }

    public void setAverageAISolarScore(double averageAISolarScore) {
        this.averageAISolarScore = averageAISolarScore;
    }

    public long getLowRiskProjectsCount() {
        return lowRiskProjectsCount;
    }

    public void setLowRiskProjectsCount(long lowRiskProjectsCount) {
        this.lowRiskProjectsCount = lowRiskProjectsCount;
    }

    public long getMediumRiskProjectsCount() {
        return mediumRiskProjectsCount;
    }

    public void setMediumRiskProjectsCount(long mediumRiskProjectsCount) {
        this.mediumRiskProjectsCount = mediumRiskProjectsCount;
    }

    public long getHighRiskProjectsCount() {
        return highRiskProjectsCount;
    }

    public void setHighRiskProjectsCount(long highRiskProjectsCount) {
        this.highRiskProjectsCount = highRiskProjectsCount;
    }

    public String getMostCommonRecommendation() {
        return mostCommonRecommendation;
    }

    public void setMostCommonRecommendation(String mostCommonRecommendation) {
        this.mostCommonRecommendation = mostCommonRecommendation;
    }

    public java.util.List<com.mpc.ai.web.dto.AIRecommendationDTO> getRecentAIRecommendations() {
        return recentAIRecommendations;
    }

    public void setRecentAIRecommendations(java.util.List<com.mpc.ai.web.dto.AIRecommendationDTO> recentAIRecommendations) {
        this.recentAIRecommendations = recentAIRecommendations;
    }

    public long getTotalOptimizedLayouts() {
        return totalOptimizedLayouts;
    }

    public void setTotalOptimizedLayouts(long totalOptimizedLayouts) {
        this.totalOptimizedLayouts = totalOptimizedLayouts;
    }

    public double getAverageOptimizationScore() {
        return averageOptimizationScore;
    }

    public void setAverageOptimizationScore(double averageOptimizationScore) {
        this.averageOptimizationScore = averageOptimizationScore;
    }

    public double getAverageRoofUtilization() {
        return averageRoofUtilization;
    }

    public void setAverageRoofUtilization(double averageRoofUtilization) {
        this.averageRoofUtilization = averageRoofUtilization;
    }

    public double getTotalCapacityPlanned() {
        return totalCapacityPlanned;
    }

    public void setTotalCapacityPlanned(double totalCapacityPlanned) {
        this.totalCapacityPlanned = totalCapacityPlanned;
    }

    public String getMostSelectedLayoutMode() {
        return mostSelectedLayoutMode;
    }

    public void setMostSelectedLayoutMode(String mostSelectedLayoutMode) {
        this.mostSelectedLayoutMode = mostSelectedLayoutMode;
    }

    public java.util.List<com.mpc.paneloptimizer.web.dto.PanelLayoutDTO> getRecentOptimizations() {
        return recentOptimizations;
    }

    public void setRecentOptimizations(java.util.List<com.mpc.paneloptimizer.web.dto.PanelLayoutDTO> recentOptimizations) {
        this.recentOptimizations = recentOptimizations;
    }
}
