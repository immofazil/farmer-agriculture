const axios = require('axios');

class WeatherService {
  constructor() {
    // You can get a free API key from OpenWeatherMap
    this.apiKey = process.env.WEATHER_API_KEY || 'demo';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    if (this.apiKey === 'demo' || this.apiKey === 'your-weather-api-key-here') {
      console.warn('⚠️ Using demo weather API key. Please set WEATHER_API_KEY in .env file for production use.');
    }
  }

  async getCurrentWeather(lat, lon) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric'
        }
      });
      
      return {
        success: true,
        data: {
          location: response.data.name,
          country: response.data.sys.country,
          temperature: Math.round(response.data.main.temp),
          feelsLike: Math.round(response.data.main.feels_like),
          humidity: response.data.main.humidity,
          pressure: response.data.main.pressure,
          windSpeed: response.data.wind.speed,
          windDirection: response.data.wind.deg,
          description: response.data.weather[0].description,
          icon: response.data.weather[0].icon,
          visibility: response.data.visibility / 1000, // Convert to km
          cloudiness: response.data.clouds.all,
          sunrise: new Date(response.data.sys.sunrise * 1000),
          sunset: new Date(response.data.sys.sunset * 1000)
        }
      };
    } catch (error) {
      console.error('Weather API Error:', error);
      return {
        success: false,
        error: 'Unable to fetch weather data'
      };
    }
  }

  async getForecast(lat, lon, days = 5) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (every 3 hours)
        }
      });

      const dailyForecasts = this.processForecastData(response.data.list);
      
      return {
        success: true,
        data: {
          location: response.data.city.name,
          country: response.data.city.country,
          forecasts: dailyForecasts
        }
      };
    } catch (error) {
      console.error('Forecast API Error:', error);
      return {
        success: false,
        error: 'Unable to fetch forecast data'
      };
    }
  }

  async getWeatherAlerts(lat, lon) {
    try {
      // Using One Call API for alerts (requires subscription)
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          lat: lat,
          lon: lon,
          appid: this.apiKey,
          exclude: 'minutely,hourly'
        }
      });

      const alerts = response.data.alerts || [];
      const processedAlerts = alerts.map(alert => ({
        title: alert.event,
        description: alert.description,
        severity: this.categorizeSeverity(alert.event),
        start: new Date(alert.start * 1000),
        end: new Date(alert.end * 1000),
        source: alert.sender_name
      }));

      return {
        success: true,
        data: processedAlerts
      };
    } catch (error) {
      // Fallback: Generate mock alerts based on current weather
      console.log('Using fallback weather alerts');
      return this.generateMockAlerts(lat, lon);
    }
  }

  processForecastData(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date: date,
          temps: [],
          conditions: [],
          humidity: [],
          windSpeed: [],
          precipitation: 0
        };
      }
      
      dailyData[date].temps.push(item.main.temp);
      dailyData[date].conditions.push(item.weather[0]);
      dailyData[date].humidity.push(item.main.humidity);
      dailyData[date].windSpeed.push(item.wind.speed);
      
      if (item.rain) {
        dailyData[date].precipitation += item.rain['3h'] || 0;
      }
    });

    return Object.values(dailyData).map(day => ({
      date: day.date,
      tempMax: Math.round(Math.max(...day.temps)),
      tempMin: Math.round(Math.min(...day.temps)),
      condition: day.conditions[0], // Use first condition of the day
      avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      avgWindSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
      precipitation: Math.round(day.precipitation * 10) / 10
    }));
  }

  categorizeSeverity(eventType) {
    const severeEvents = ['tornado', 'hurricane', 'severe thunderstorm', 'flash flood'];
    const moderateEvents = ['thunderstorm', 'heavy rain', 'snow', 'wind'];
    
    const lowerEvent = eventType.toLowerCase();
    
    if (severeEvents.some(event => lowerEvent.includes(event))) {
      return 'severe';
    } else if (moderateEvents.some(event => lowerEvent.includes(event))) {
      return 'moderate';
    }
    return 'minor';
  }

  async generateMockAlerts(lat, lon) {
    try {
      const currentWeather = await this.getCurrentWeather(lat, lon);
      const alerts = [];

      if (currentWeather.success) {
        const weather = currentWeather.data;
        
        // Generate alerts based on current conditions
        if (weather.windSpeed > 10) {
          alerts.push({
            title: 'High Wind Warning',
            description: `Strong winds expected with speeds up to ${Math.round(weather.windSpeed * 3.6)} km/h. Secure loose objects and avoid outdoor activities.`,
            severity: 'moderate',
            start: new Date(),
            end: new Date(Date.now() + 24 * 60 * 60 * 1000),
            source: 'Local Weather Service'
          });
        }

        if (weather.humidity > 80 && weather.temperature > 25) {
          alerts.push({
            title: 'Heat and Humidity Advisory',
            description: `High humidity (${weather.humidity}%) combined with temperature of ${weather.temperature}°C may cause discomfort. Stay hydrated and avoid prolonged outdoor exposure.`,
            severity: 'minor',
            start: new Date(),
            end: new Date(Date.now() + 12 * 60 * 60 * 1000),
            source: 'Health Advisory'
          });
        }

        if (weather.description.includes('rain')) {
          alerts.push({
            title: 'Rain Expected',
            description: `${weather.description.charAt(0).toUpperCase() + weather.description.slice(1)} conditions expected. Plan indoor activities and ensure proper drainage.`,
            severity: 'minor',
            start: new Date(),
            end: new Date(Date.now() + 6 * 60 * 60 * 1000),
            source: 'Weather Forecast'
          });
        }
      }

      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      return {
        success: false,
        error: 'Unable to generate weather alerts'
      };
    }
  }

  formatWeatherForAI(weatherData, location) {
    if (!weatherData.success) {
      return "Weather data is currently unavailable.";
    }

    const weather = weatherData.data;
    return `Current weather in ${weather.location || location}:
- Temperature: ${weather.temperature}°C (feels like ${weather.feelsLike}°C)
- Conditions: ${weather.description}
- Humidity: ${weather.humidity}%
- Wind: ${weather.windSpeed} m/s
- Pressure: ${weather.pressure} hPa
- Visibility: ${weather.visibility} km
- Sunrise: ${weather.sunrise?.toLocaleTimeString()}
- Sunset: ${weather.sunset?.toLocaleTimeString()}`;
  }

  formatForecastForAI(forecastData) {
    if (!forecastData.success) {
      return "Forecast data is currently unavailable.";
    }

    const forecasts = forecastData.data.forecasts.slice(0, 5); // Next 5 days
    let forecastText = `5-day weather forecast for ${forecastData.data.location}:\n`;
    
    forecasts.forEach((day, index) => {
      const dayName = index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en', { weekday: 'long' });
      forecastText += `${dayName}: ${day.tempMin}°C to ${day.tempMax}°C, ${day.condition.description}`;
      if (day.precipitation > 0) {
        forecastText += `, ${day.precipitation}mm rain expected`;
      }
      forecastText += '\n';
    });

    return forecastText;
  }

  formatAlertsForAI(alertsData) {
    if (!alertsData.success || alertsData.data.length === 0) {
      return "No active weather warnings or alerts.";
    }

    let alertText = "Active weather alerts:\n";
    alertsData.data.forEach(alert => {
      alertText += `- ${alert.title} (${alert.severity}): ${alert.description}\n`;
      alertText += `  Valid until: ${alert.end.toLocaleString()}\n`;
    });

    return alertText;
  }
}

module.exports = new WeatherService();