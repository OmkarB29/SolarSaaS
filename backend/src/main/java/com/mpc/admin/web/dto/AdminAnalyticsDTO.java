package com.mpc.admin.web.dto;

import java.util.List;

public class AdminAnalyticsDTO {
    private List<TopLocationDTO> topLocations;
    private List<RoiDistributionDTO> roiDistribution;
    private List<MonthlyTrendDTO> monthlyTrends;
    private double totalGeneratedEnergy;
    private double totalCo2Saved;
    private List<HighestRoiProjectDTO> highestRoiProjects;
    private List<WeatherImpactDTO> weatherImpact;
    private double averageForecastEnergy;
    private double forecastAccuracyMetric;
    private double forecastWeatherImpactAvg;
    private double averageBatteryRecommendation;
    private double totalStorageCapacityPlanned;
    private double gridIndependenceRate;
    private long totalEmailsSent;
    private long successfulEmailDeliveries;
    private long failedEmailDeliveries;
    private List<RecentEmailDTO> recentEmails;

    public AdminAnalyticsDTO(List<TopLocationDTO> topLocations,
                             List<RoiDistributionDTO> roiDistribution,
                             List<MonthlyTrendDTO> monthlyTrends,
                             double totalGeneratedEnergy,
                             double totalCo2Saved,
                             List<HighestRoiProjectDTO> highestRoiProjects,
                             List<WeatherImpactDTO> weatherImpact) {
        this.topLocations = topLocations;
        this.roiDistribution = roiDistribution;
        this.monthlyTrends = monthlyTrends;
        this.totalGeneratedEnergy = totalGeneratedEnergy;
        this.totalCo2Saved = totalCo2Saved;
        this.highestRoiProjects = highestRoiProjects;
        this.weatherImpact = weatherImpact;
        this.averageForecastEnergy = 52.4;
        this.forecastAccuracyMetric = 94.8;
        this.forecastWeatherImpactAvg = 88.5;
        this.averageBatteryRecommendation = 25.0;
        this.totalStorageCapacityPlanned = 95.0;
        this.gridIndependenceRate = 84.5;
    }

    public AdminAnalyticsDTO(List<TopLocationDTO> topLocations,
                             List<RoiDistributionDTO> roiDistribution,
                             List<MonthlyTrendDTO> monthlyTrends,
                             double totalGeneratedEnergy,
                             double totalCo2Saved,
                             List<HighestRoiProjectDTO> highestRoiProjects,
                             List<WeatherImpactDTO> weatherImpact,
                             double averageForecastEnergy,
                             double forecastAccuracyMetric,
                             double forecastWeatherImpactAvg) {
        this.topLocations = topLocations;
        this.roiDistribution = roiDistribution;
        this.monthlyTrends = monthlyTrends;
        this.totalGeneratedEnergy = totalGeneratedEnergy;
        this.totalCo2Saved = totalCo2Saved;
        this.highestRoiProjects = highestRoiProjects;
        this.weatherImpact = weatherImpact;
        this.averageForecastEnergy = averageForecastEnergy;
        this.forecastAccuracyMetric = forecastAccuracyMetric;
        this.forecastWeatherImpactAvg = forecastWeatherImpactAvg;
        this.averageBatteryRecommendation = 25.0;
        this.totalStorageCapacityPlanned = 95.0;
        this.gridIndependenceRate = 84.5;
    }

    public AdminAnalyticsDTO(List<TopLocationDTO> topLocations,
                             List<RoiDistributionDTO> roiDistribution,
                             List<MonthlyTrendDTO> monthlyTrends,
                             double totalGeneratedEnergy,
                             double totalCo2Saved,
                             List<HighestRoiProjectDTO> highestRoiProjects,
                             List<WeatherImpactDTO> weatherImpact,
                             double averageForecastEnergy,
                             double forecastAccuracyMetric,
                             double forecastWeatherImpactAvg,
                             double averageBatteryRecommendation,
                             double totalStorageCapacityPlanned,
                             double gridIndependenceRate) {
        this.topLocations = topLocations;
        this.roiDistribution = roiDistribution;
        this.monthlyTrends = monthlyTrends;
        this.totalGeneratedEnergy = totalGeneratedEnergy;
        this.totalCo2Saved = totalCo2Saved;
        this.highestRoiProjects = highestRoiProjects;
        this.weatherImpact = weatherImpact;
        this.averageForecastEnergy = averageForecastEnergy;
        this.forecastAccuracyMetric = forecastAccuracyMetric;
        this.forecastWeatherImpactAvg = forecastWeatherImpactAvg;
        this.averageBatteryRecommendation = averageBatteryRecommendation;
        this.totalStorageCapacityPlanned = totalStorageCapacityPlanned;
        this.gridIndependenceRate = gridIndependenceRate;
    }

    public List<TopLocationDTO> getTopLocations() {
        return topLocations;
    }

    public void setTopLocations(List<TopLocationDTO> topLocations) {
        this.topLocations = topLocations;
    }

    public List<RoiDistributionDTO> getRoiDistribution() {
        return roiDistribution;
    }

    public void setRoiDistribution(List<RoiDistributionDTO> roiDistribution) {
        this.roiDistribution = roiDistribution;
    }

    public List<MonthlyTrendDTO> getMonthlyTrends() {
        return monthlyTrends;
    }

    public void setMonthlyTrends(List<MonthlyTrendDTO> monthlyTrends) {
        this.monthlyTrends = monthlyTrends;
    }

    public double getTotalGeneratedEnergy() {
        return totalGeneratedEnergy;
    }

    public void setTotalGeneratedEnergy(double totalGeneratedEnergy) {
        this.totalGeneratedEnergy = totalGeneratedEnergy;
    }

    public double getTotalCo2Saved() {
        return totalCo2Saved;
    }

    public void setTotalCo2Saved(double totalCo2Saved) {
        this.totalCo2Saved = totalCo2Saved;
    }

    public List<HighestRoiProjectDTO> getHighestRoiProjects() {
        return highestRoiProjects;
    }

    public void setHighestRoiProjects(List<HighestRoiProjectDTO> highestRoiProjects) {
        this.highestRoiProjects = highestRoiProjects;
    }

    public List<WeatherImpactDTO> getWeatherImpact() {
        return weatherImpact;
    }

    public void setWeatherImpact(List<WeatherImpactDTO> weatherImpact) {
        this.weatherImpact = weatherImpact;
    }

    public double getAverageForecastEnergy() {
        return averageForecastEnergy;
    }

    public void setAverageForecastEnergy(double averageForecastEnergy) {
        this.averageForecastEnergy = averageForecastEnergy;
    }

    public double getForecastAccuracyMetric() {
        return forecastAccuracyMetric;
    }

    public void setForecastAccuracyMetric(double forecastAccuracyMetric) {
        this.forecastAccuracyMetric = forecastAccuracyMetric;
    }

    public double getForecastWeatherImpactAvg() {
        return forecastWeatherImpactAvg;
    }

    public void setForecastWeatherImpactAvg(double forecastWeatherImpactAvg) {
        this.forecastWeatherImpactAvg = forecastWeatherImpactAvg;
    }

    public double getAverageBatteryRecommendation() {
        return averageBatteryRecommendation;
    }

    public void setAverageBatteryRecommendation(double averageBatteryRecommendation) {
        this.averageBatteryRecommendation = averageBatteryRecommendation;
    }

    public double getTotalStorageCapacityPlanned() {
        return totalStorageCapacityPlanned;
    }

    public void setTotalStorageCapacityPlanned(double totalStorageCapacityPlanned) {
        this.totalStorageCapacityPlanned = totalStorageCapacityPlanned;
    }

    public double getGridIndependenceRate() {
        return gridIndependenceRate;
    }

    public void setGridIndependenceRate(double gridIndependenceRate) {
        this.gridIndependenceRate = gridIndependenceRate;
    }

    public static class TopLocationDTO {
        private String locationName;
        private int count;
        private double avgROI;

        public TopLocationDTO(String locationName, int count, double avgROI) {
            this.locationName = locationName;
            this.count = count;
            this.avgROI = avgROI;
        }

        public String getLocationName() {
            return locationName;
        }

        public void setLocationName(String locationName) {
            this.locationName = locationName;
        }

        public int getCount() {
            return count;
        }

        public void setCount(int count) {
            this.count = count;
        }

        public double getAvgROI() {
            return avgROI;
        }

        public void setAvgROI(double avgROI) {
            this.avgROI = avgROI;
        }
    }

    public static class RoiDistributionDTO {
        private String range;
        private int count;

        public RoiDistributionDTO(String range, int count) {
            this.range = range;
            this.count = count;
        }

        public String getRange() {
            return range;
        }

        public void setRange(String range) {
            this.range = range;
        }

        public int getCount() {
            return count;
        }

        public void setCount(int count) {
            this.count = count;
        }
    }

    public static class MonthlyTrendDTO {
        private String month;
        private long newAnalyses;
        private double totalGeneration;

        public MonthlyTrendDTO(String month, long newAnalyses, double totalGeneration) {
            this.month = month;
            this.newAnalyses = newAnalyses;
            this.totalGeneration = totalGeneration;
        }

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public long getNewAnalyses() {
            return newAnalyses;
        }

        public void setNewAnalyses(long newAnalyses) {
            this.newAnalyses = newAnalyses;
        }

        public double getTotalGeneration() {
            return totalGeneration;
        }

        public void setTotalGeneration(double totalGeneration) {
            this.totalGeneration = totalGeneration;
        }
    }

    public static class HighestRoiProjectDTO {
        private String projectName;
        private double roi;
        private double annualGeneration;

        public HighestRoiProjectDTO(String projectName, double roi, double annualGeneration) {
            this.projectName = projectName;
            this.roi = roi;
            this.annualGeneration = annualGeneration;
        }

        public String getProjectName() {
            return projectName;
        }

        public void setProjectName(String projectName) {
            this.projectName = projectName;
        }

        public double getRoi() {
            return roi;
        }

        public void setRoi(double roi) {
            this.roi = roi;
        }

        public double getAnnualGeneration() {
            return annualGeneration;
        }

        public void setAnnualGeneration(double annualGeneration) {
            this.annualGeneration = annualGeneration;
        }
    }

    public static class WeatherImpactDTO {
        private String label;
        private double value;
        private String unit;

        public WeatherImpactDTO(String label, double value, String unit) {
            this.label = label;
            this.value = value;
            this.unit = unit;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public double getValue() {
            return value;
        }

        public void setValue(double value) {
            this.value = value;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }
    }

    public long getTotalEmailsSent() {
        return totalEmailsSent;
    }

    public void setTotalEmailsSent(long totalEmailsSent) {
        this.totalEmailsSent = totalEmailsSent;
    }

    public long getSuccessfulEmailDeliveries() {
        return successfulEmailDeliveries;
    }

    public void setSuccessfulEmailDeliveries(long successfulEmailDeliveries) {
        this.successfulEmailDeliveries = successfulEmailDeliveries;
    }

    public long getFailedEmailDeliveries() {
        return failedEmailDeliveries;
    }

    public void setFailedEmailDeliveries(long failedEmailDeliveries) {
        this.failedEmailDeliveries = failedEmailDeliveries;
    }

    public List<RecentEmailDTO> getRecentEmails() {
        return recentEmails;
    }

    public void setRecentEmails(List<RecentEmailDTO> recentEmails) {
        this.recentEmails = recentEmails;
    }

    public static class RecentEmailDTO {
        private Long id;
        private String recipientEmail;
        private String subject;
        private String status;
        private java.time.Instant sentAt;
        private String errorMessage;

        public RecentEmailDTO() {
        }

        public RecentEmailDTO(Long id, String recipientEmail, String subject, String status, java.time.Instant sentAt, String errorMessage) {
            this.id = id;
            this.recipientEmail = recipientEmail;
            this.subject = subject;
            this.status = status;
            this.sentAt = sentAt;
            this.errorMessage = errorMessage;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getRecipientEmail() {
            return recipientEmail;
        }

        public void setRecipientEmail(String recipientEmail) {
            this.recipientEmail = recipientEmail;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public java.time.Instant getSentAt() {
            return sentAt;
        }

        public void setSentAt(java.time.Instant sentAt) {
            this.sentAt = sentAt;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }
    }
}
