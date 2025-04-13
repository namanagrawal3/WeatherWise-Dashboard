import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import WeatherCard from './components/WeatherCard';

// Backend API URL - deployed on Render
const API_URL = 'https://weatherwise-dashboard-backend-gnbt.onrender.com';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');

  // Load search history on component mount
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
      setSearchHistory([]);
    }
  }, []);

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  const fetchWeatherData = async (city) => {
    if (!city?.trim()) {
      setError('Please enter a city name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching weather data for: ${city}`);
      console.log('API URL:', `${API_URL}/api/weather?city=${encodeURIComponent(city.trim())}`);

      const response = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(city.trim())}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log('Weather data received:', data);

      if (data.success) {
        setWeatherData(data);
        
        // Add to search history if not already present
        if (!searchHistory.includes(city)) {
          setSearchHistory(prev => [city, ...prev].slice(0, 5));
        }
      } else {
        throw new Error(data.message || 'Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData(null);
      setError('Network error: Could not connect to the weather server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (city) => {
    fetchWeatherData(city);
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="app-title">WeatherWise Dashboard</h1>
        {serverStatus === 'offline' && (
          <div className="server-status error">
            Server is offline. Please try again later.
          </div>
        )}
        
        <SearchBar 
          onSearch={fetchWeatherData} 
          searchHistory={searchHistory}
          disabled={serverStatus === 'offline' || loading}
        />
        
        {searchHistory.length > 0 && (
          <div className="search-history fade-in">
            <h3>Recent Searches</h3>
            <div className="history-items">
              {searchHistory.map((city, index) => (
                <button 
                  key={index} 
                  className="history-item"
                  onClick={() => handleHistoryClick(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {loading && <div className="loading">Loading weather data...</div>}
        
        {error && <div className="error-message slide-up">{error}</div>}
        
        {weatherData && !loading && !error && (
          <WeatherCard 
            current={weatherData.current} 
            forecast={weatherData.forecast} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
