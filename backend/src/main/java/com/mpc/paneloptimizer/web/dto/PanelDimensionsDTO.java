package com.mpc.paneloptimizer.web.dto;

public class PanelDimensionsDTO {

    private double lengthMeters = 2.1;
    private double widthMeters = 1.1;
    private double powerWatts = 550.0;
    private double areaM2 = 2.31;

    public PanelDimensionsDTO() {
    }

    public PanelDimensionsDTO(double lengthMeters, double widthMeters, double powerWatts) {
        this.lengthMeters = lengthMeters > 0 ? lengthMeters : 2.1;
        this.widthMeters = widthMeters > 0 ? widthMeters : 1.1;
        this.powerWatts = powerWatts > 0 ? powerWatts : 550.0;
        this.areaM2 = Math.round(this.lengthMeters * this.widthMeters * 100.0) / 100.0;
    }

    public double getLengthMeters() {
        return lengthMeters;
    }

    public void setLengthMeters(double lengthMeters) {
        this.lengthMeters = lengthMeters;
        this.areaM2 = Math.round(this.lengthMeters * this.widthMeters * 100.0) / 100.0;
    }

    public double getWidthMeters() {
        return widthMeters;
    }

    public void setWidthMeters(double widthMeters) {
        this.widthMeters = widthMeters;
        this.areaM2 = Math.round(this.lengthMeters * this.widthMeters * 100.0) / 100.0;
    }

    public double getPowerWatts() {
        return powerWatts;
    }

    public void setPowerWatts(double powerWatts) {
        this.powerWatts = powerWatts;
    }

    public double getAreaM2() {
        return areaM2;
    }

    public void setAreaM2(double areaM2) {
        this.areaM2 = areaM2;
    }
}
