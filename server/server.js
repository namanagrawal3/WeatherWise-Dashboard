const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Load environment variables
dotenv.config();

// Constants
const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const PORT = process.env.PORT || 5000;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Initialize express app
const app = express();

// CORS configuration - must be before any routes
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Process forecast data to get one entry per day (for 5 days)
const processForecastData = (forecastData) => {
  if (!forecastData || !forecastData.list || !Array.isArray(forecastData.list)) {
    return [];
  }

  // Group forecast items by day
  const forecastsByDay = {};
  
  forecastData.list.forEach(item => {
    // Convert timestamp to date string (YYYY-MM-DD format)
    const date = new Date(item.dt * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!forecastsByDay[dateStr]) {
      forecastsByDay[dateStr] = [];
    }
    
    forecastsByDay[dateStr].push(item);
  });

  // For each day, get the forecast for midday (around 12:00-14:00)
  const dailyForecasts = [];
  
  Object.keys(forecastsByDay).forEach(dateStr => {
    const forecasts = forecastsByDay[dateStr];
    
    // Find forecast closest to noon
    let middayForecast = forecasts[0];
    let minDiff = Infinity;
    
    forecasts.forEach(forecast => {
      const forecastDate = new Date(forecast.dt * 1000);
      const hours = forecastDate.getHours();
      const diff = Math.abs(hours - 12);
      
      if (diff < minDiff) {
        minDiff = diff;
        middayForecast = forecast;
      }
    });
    
    // Process forecast data
    dailyForecasts.push({
      date: middayForecast.dt,
      temperature: middayForecast.main.temp,
      feels_like: middayForecast.main.feels_like,
      humidity: middayForecast.main.humidity,
      pressure: middayForecast.main.pressure,
      weather: {
        main: middayForecast.weather[0].main,
        description: middayForecast.weather[0].description,
        icon: middayForecast.weather[0].icon
      },
      wind: {
        speed: middayForecast.wind.speed,
        deg: middayForecast.wind.deg
      }
    });
  });
  
  // Return at most 5 days of forecasts
  return dailyForecasts.slice(0, 5);
};

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({
      success: false,
      message: 'City parameter is required'
    });
  }

  if (!API_KEY) {
    console.error('OpenWeatherMap API key is not configured');
    return res.status(500).json({
      success: false,
      message: 'Weather service is not properly configured'
    });
  }

  try {
    console.log(`Fetching weather data for: ${city}`);
    
    // Current weather URL
    const currentWeatherUrl = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
    // 5-day forecast URL (every 3 hours)
    const forecastUrl = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
    // Make both API calls in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(currentWeatherUrl),
      axios.get(forecastUrl)
    ]);
    
    console.log(`Weather data received for: ${city}`);
    
    // Process forecast data to get daily forecasts
    const forecast = processForecastData(forecastResponse.data);

    res.json({
      success: true,
      current: currentResponse.data,
      forecast: forecast
    });
  } catch (error) {
    console.error('Weather API Error:', error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch weather data';
    
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WeatherWise API'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Weather API: http://localhost:${PORT}/api/weather?city=London`);
});
