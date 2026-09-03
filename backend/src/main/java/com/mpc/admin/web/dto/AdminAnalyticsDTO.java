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
}
