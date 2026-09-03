package com.mpc.weather.web;

import com.mpc.weather.service.WeatherService;
import com.mpc.weather.web.dto.WeatherResponseDTO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping
    public WeatherResponseDTO getWeather(@RequestParam("lat") double latitude,
                                         @RequestParam("lon") double longitude) {
        return weatherService.getWeather(latitude, longitude);
    }
}
