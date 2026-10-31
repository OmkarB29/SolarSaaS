package com.mpc.scene3d.dto;

public class Scene3DLocalPoint {
    private double x; // East meters from centroid
    private double y; // North meters from centroid
    private double z; // Height meters (0 = ground)

    public Scene3DLocalPoint() {}
    public Scene3DLocalPoint(double x, double y, double z) { this.x = x; this.y = y; this.z = z; }
    public double getX() { return x; }
    public void setX(double x) { this.x = x; }
    public double getY() { return y; }
    public void setY(double y) { this.y = y; }
    public double getZ() { return z; }
    public void setZ(double z) { this.z = z; }
}
