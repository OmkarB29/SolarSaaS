package com.mpc.ai.web.dto;

public class ActionPlanStepDTO {
    private int step;
    private String title;
    private String description;

    public ActionPlanStepDTO() {
    }

    public ActionPlanStepDTO(int step, String title, String description) {
        this.step = step;
        this.title = title;
        this.description = description;
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
