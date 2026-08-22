# ☀️ SolarSaaS – AI Powered Rooftop Solar Analysis & Financial Estimation Platform

## Overview

SolarSaaS is a full-stack web application that helps homeowners and businesses evaluate the feasibility of installing rooftop solar panels. Using satellite maps, users can draw their rooftop, calculate the usable installation area, estimate solar generation capacity, analyze financial returns, and generate a detailed report—all without requiring an initial physical site survey.

The platform combines modern web technologies with intelligent calculation algorithms to provide quick, accurate, and user-friendly solar assessments.

---

# Features

### Authentication & User Management

* Secure JWT-based Authentication
* User Registration & Login
* Protected Routes
* User Dashboard

### Rooftop Analysis

* Google Maps Satellite View Integration
* Interactive Rooftop Polygon Drawing
* Automatic Rooftop Area Calculation
* Usable Roof Area Estimation

### Solar Analysis

* Solar Panel Capacity Estimation
* Annual Energy Generation Prediction
* System Size Recommendation
* CO₂ Emission Reduction Estimation

### Financial Estimation

* Installation Cost Estimation
* Annual Savings Prediction
* Payback Period Calculation
* Return on Investment (ROI)
* Long-Term Financial Analysis

### Reports

* Downloadable PDF Report
* Complete Solar Analysis Summary
* Financial Breakdown
* User-Friendly Report Format

---

# Tech Stack

## Frontend

* React.js
* Vite
* JavaScript
* CSS
* Axios
* React Router
* Google Maps JavaScript API

---

## Backend

* Java 25
* Spring Boot
* Spring Security
* Spring Data JPA
* JWT Authentication
* REST APIs
* Maven

---

## Database

* PostgreSQL

---

## APIs & External Services

* Google Maps JavaScript API
* Google Maps Geometry Library

---

## Tools & Technologies

* IntelliJ IDEA
* VS Code
* Postman
* Git
* GitHub
* Maven

---

# System Architecture

```text
                User
                  │
                  ▼
          React Frontend (Vite)
                  │
        REST API (HTTP/JSON)
                  │
                  ▼
       Spring Boot Backend
      ├── Authentication
      ├── Solar Analysis Engine
      ├── Financial Calculator
      ├── Report Generator
      └── Business Logic
                  │
                  ▼
            PostgreSQL Database

                  │
                  ▼
         Google Maps JavaScript API
```

---

# Project Structure

```text
SolarSaaS/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/main/java/
│   ├── src/main/resources/
│   ├── pom.xml
│   └── mvnw
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/OmkarB29/SolarSaaS.git

cd SolarSaaS
```

---

# Backend Setup

Navigate to backend

```bash
cd backend
```

Configure PostgreSQL in `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/solarsaas

spring.datasource.username=YOUR_USERNAME

spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update
```

Run Backend

```bash
./mvnw spring-boot:run
```

or

```bash
mvn spring-boot:run
```

Backend runs on

```
http://localhost:8080
```

---

# Frontend Setup

Navigate to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Start Development Server

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# Environment Variables

## Backend

```properties
JWT_SECRET=your-secret-key

GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Frontend

```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

VITE_API_BASE_URL=http://localhost:8080
```

---

# REST API Modules

Authentication

* Register
* Login
* JWT Authentication

Users

* User Profile
* Dashboard

Solar Analysis

* Rooftop Area Calculation
* Solar Capacity Estimation
* Energy Generation

Financial Analysis

* Cost Estimation
* ROI Calculation
* Payback Analysis

Reports

* Generate PDF Report

---

# Future Enhancements

* AI-powered rooftop detection from satellite imagery
* Automatic panel placement optimization
* Weather-based generation forecasting
* Government subsidy recommendations
* Multiple city and country support
* Electricity tariff integration
* Admin Dashboard & Analytics
* Cloud Deployment (AWS/Azure/GCP)

---

# Learning Outcomes

This project demonstrates practical experience with:

* Full-Stack Development
* Spring Boot
* React.js
* REST API Design
* JWT Authentication
* PostgreSQL
* Spring Security
* Google Maps API Integration
* Financial Calculation Algorithms
* Report Generation
* Git & GitHub
* Software Architecture
* Clean Code Principles

---

# Author

**Omkar Birajdar**

* GitHub: https://github.com/OmkarB29
* LinkedIn: https://linkedin.com/in/omkar-birajdar-779a5a298

---

# License

This project is developed for educational and learning purposes.
