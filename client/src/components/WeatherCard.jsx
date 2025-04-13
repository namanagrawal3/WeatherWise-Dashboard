import React from 'react';
import './WeatherCard.css';

const WeatherCard = ({ current, forecast }) => {
  if (!current) return null;

  // Format date from timestamp
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Process current weather data for easier access
  const processedCurrent = {
    city: current.name || 'Unknown',
    country: current.sys?.country || '',
    timestamp: current.dt || Date.now() / 1000,
    temperature: current.main?.temp || 0,
    feels_like: current.main?.feels_like || 0,
    humidity: current.main?.humidity || 0,
    pressure: current.main?.pressure || 0,
    wind: {
      speed: current.wind?.speed || 0,
      deg: current.wind?.deg || 0
    },
    weather: {
      main: current.weather?.[0]?.main || 'Clear',
      description: current.weather?.[0]?.description || 'Clear sky',
      icon: current.weather?.[0]?.icon || '01d'
    }
  };

  return (
    <div className="weather-container">
      {/* Current Weather Section */}
      <div className="current-weather">
        <div className="weather-header">
          <h2>{processedCurrent.city}, {processedCurrent.country}</h2>
          <p className="current-date">{formatDate(processedCurrent.timestamp)}</p>
        </div>
        
        <div className="weather-main">
          <div className="weather-icon">
            <img 
              src={`https://openweathermap.org/img/wn/${processedCurrent.weather.icon}@4x.png`} 
              alt={processedCurrent.weather.description} 
            />
            <p>{processedCurrent.weather.main}</p>
          </div>
          
          <div className="temperature">
            <h1>{Math.round(processedCurrent.temperature)}°C</h1>
            <p>Feels like: {Math.round(processedCurrent.feels_like)}°C</p>
          </div>
        </div>
        
        <div className="weather-details">
          <div className="detail-item">
            <span className="detail-label">Humidity</span>
            <span className="detail-value">{processedCurrent.humidity}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Wind</span>
            <span className="detail-value">{processedCurrent.wind.speed} m/s</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Pressure</span>
            <span className="detail-value">{processedCurrent.pressure} hPa</span>
          </div>
        </div>
      </div>
      
      {/* 5-Day Forecast Section - Only show if forecast data exists */}
      {forecast && forecast.length > 0 && (
        <div className="forecast">
          <h3>5-Day Forecast</h3>
          <div className="forecast-container">
            {forecast.map((day, index) => (
              <div key={index} className="forecast-day">
                <p className="forecast-date">{formatDate(day.date)}</p>
                <img 
                  src={`https://openweathermap.org/img/wn/${day.weather.icon}.png`} 
                  alt={day.weather.description} 
                />
                <p className="forecast-temp">{Math.round(day.temperature)}°C</p>
                <p className="forecast-desc">{day.weather.main}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
