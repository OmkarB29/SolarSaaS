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

* Java 21
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

If you see `UnsupportedClassVersionError`, make sure the backend is launched with Java 21:

```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
cd backend
mvn spring-boot:run
```

If port `8080` is already in use, start it on another port:

```powershell
mvn spring-boot:run '-Dspring-boot.run.arguments=--server.port=8082'
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

---

# 🏢 3D Rooftop CAD Selection & Meshy AI 3D Pipeline

### 1. Overview
The **3D Rooftop CAD & Meshy AI Pipeline** enables users to view photorealistic 3D maps, delineate roof boundaries and exclusion zones (such as HVAC chillers, water tanks, and stairwell rooms), inspect live Turf.js metrics (gross area, net usable area, perimeter, dominant bearing, and minimum rotated rectangle), and generate interactive 3D visual models using Meshy AI (`meshy-7.1`). The measured metric geometry is fed directly into the Obstacle-Aware Solar Panel Optimizer to guarantee accurate panel counts and placement.

### 2. Environment Variables & Setup
Copy `.env.example` to `.env` and configure:
```bash
# Frontend Key (Browser-Only, Referrer-restricted to localhost:5173 and your domain)
VITE_GOOGLE_MAPS_BROWSER_KEY=your_google_maps_browser_key

# Backend Keys (Server-Only, never exposed to client)
GOOGLE_MAPS_SERVER_KEY=your_google_maps_server_key
MESHY_API_KEY=your_meshy_api_key

# Execution Mode (Defaults to true for zero credit cost)
MESHY_MOCK_ENABLED=true
ROOFTOP_IMAGERY_GOOGLE_STATIC_ENABLED=false
ROOFTOP_STORAGE_GLB_DIR=uploads/models3d
```

> [!WARNING]
> **Git Tracking of `.env`**: A previous commit in the project's repository history tracked `.env`. The project adheres to strict key hygiene: real production secrets must never be committed. Follow git best practices or environment variable injection (e.g. Docker / Kubernetes secrets) in production.

### 3. How to Run in Mock Mode (Zero Credit Cost)
1. In `backend/src/main/resources/application.properties` (or your local environment), keep:
   ```properties
   meshy.mock-enabled=true
   ```
2. Start the backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
4. Navigate to `/model-3d` ("3D Model View" in sidebar).
5. Draw rooftop polygon points and mark obstacles.
6. Click **Generate 3D Model (Meshy AI)**: The backend will simulate generation progress and instantly serve the bundled high-resolution box building GLB (`mock-building.glb`) with **zero API credits consumed**.

### 4. How to Switch to Real Mode
1. Ensure your Meshy account has available credits (obtain an API key from [Meshy AI](https://meshy.ai)).
2. Set in your environment:
   ```bash
   MESHY_MOCK_ENABLED=false
   MESHY_API_KEY=msy_your_real_key_here
   ```
3. Supply an aerial/drone image via the uploaded image provider or configure legal imagery access.
4. Restart the Spring Boot backend. The backend will invoke `POST https://api.meshy.ai/openapi/v1/image-to-3d` using model `meshy-7.1`, poll progress asynchronously according to `Retry-After` headers, and automatically cache the resulting GLB file to `uploads/models3d/` to prevent asset expiration.

### 5. Known Limitations & Documented Risks
* **Measured Geometry vs. AI Mesh Primacy**: AI-generated 3D meshes (Meshy AI) possess arbitrary orientation, scale, and surface irregularities without real-world metric dimensions. Consequently, **all panel counts, capacities, setbacks, and generation figures come exclusively from measured metric geometry** (via equirectangular projections in metres), never from the AI mesh.
* **Google Maps Terms of Service (Licensing)**: Google Maps Platform Terms of Service (Sections 3.2.3 and 3.2.4) prohibit scraping, capturing, or creating derivative 3D meshes using Google Maps imagery without an explicit Enterprise agreement. To remain fully compliant, `rooftop.imagery.google-static.enabled` is defaulted to `false`, and users can provide their own aerial/drone imagery via `UploadedImageProvider`.
* **3-Day Asset Retention**: Meshy non-enterprise plans retain generated models on signed URLs for only ~72 hours (3 days). SolarSaaS defends against asset loss by immediately downloading and persisting the GLB locally in `uploads/models3d/` as soon as the task status transitions to `SUCCEEDED`.
* **3D Photorealistic Tiles Coverage**: Google Photorealistic 3D Maps tiles require hardware acceleration and WebGL2. In areas without 3D tile coverage or on unsupported devices, SolarSaaS automatically falls back to an interactive 2D Google Satellite view with editable polygon vertices.

---

# Author

**Omkar Birajdar**

* GitHub: https://github.com/OmkarB29
* LinkedIn: https://linkedin.com/in/omkar-birajdar-779a5a298

---

# License

This project is developed for educational and learning purposes.
