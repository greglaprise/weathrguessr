# WeatherGuessr 🌍

A real-time, image-enhanced, multiple-choice game where users guess the forecasted high and low temperatures of randomly chosen major world cities.

## Features

### 🕹️ Gameplay
- Random city selection from 100+ major world cities
- Real-time weather data from Open-Meteo API
- City images from Wikimedia Commons
- Multiple-choice temperature guessing with immediate feedback

### 🔧 Core Features
- **🌡️ Temperature Toggle**: Switch between Celsius and Fahrenheit
- **🌗 Dark/Light Mode**: Toggle UI themes
- **📸 City Images**: Display city photos from Wikimedia Commons
- **🔄 API Status Check**: Monitor API health
- **📊 Score Tracking**: Track rounds, correct answers, accuracy, and streaks
- **📱 Responsive Design**: Mobile-first layout
- **🌐 Globe Favicon**: Custom globe icon

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **APIs**: 
  - Open-Meteo (weather data)
  - Wikimedia Commons (city images)
- **Deployment**: Docker-ready

## Quick Start

### Local Development
1. Clone or download the project
2. Open `index.html` in a web browser
3. Start guessing temperatures!

### Docker Deployment
```bash
# Build the image
docker build -t weatherguessr .

# Run the container
docker run -p 8080:80 weatherguessr
```

Then visit `http://localhost:8080` to play!

## Game Rules

1. A random city is selected and displayed with its image
2. Four temperature options are shown (high/low pairs)
3. Select the correct forecasted temperatures for today
4. Get immediate feedback and see your running statistics
5. Continue playing to improve your accuracy and streak!

## API Usage

The game uses two free APIs:
- **Open-Meteo**: Provides weather forecast data
- **Wikimedia Commons**: Supplies city images

Both APIs are accessed client-side with CORS support.

## Browser Compatibility

Works on all modern browsers including:
- Chrome/Chromium
- Firefox
- Safari
- Edge

Mobile browsers are fully supported with responsive design.

## Contributing

This is a simple educational project. Feel free to fork and enhance!