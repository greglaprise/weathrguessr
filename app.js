class WeatherGuessr {
    constructor() {
        this.currentCity = null;
        this.currentWeather = null;
        this.gameStats = {
            round: 1,
            correct: 0,
            streak: 0,
            isMetric: false
        };
        this.gameState = 'waiting'; // waiting, answered, loading
        this.correctAnswer = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.initializeTemperatureToggle();
        this.checkFirstVisit();
        this.startNewRound();
    }

    initializeElements() {
        this.elements = {
            cityName: document.getElementById('city-name'),
            cityImage: document.getElementById('city-image'),
            choices: document.getElementById('choices'),
            feedback: document.getElementById('feedback'),
            nextRound: document.getElementById('next-round'),
            newGame: document.getElementById('new-game'),
            loading: document.getElementById('loading'),
            gameContainer: document.getElementById('game-container'),
            
            // Welcome dialog
            welcomeDialog: document.getElementById('welcome-dialog'),
            closeWelcome: document.getElementById('close-welcome'),
            startPlaying: document.getElementById('start-playing'),
            
            // Controls
            themeToggle: document.getElementById('theme-toggle'),
            tempToggle: document.getElementById('temp-toggle'),
            apiStatus: document.getElementById('api-status'),
            
            // Stats
            roundCount: document.getElementById('round-count'),
            correctCount: document.getElementById('correct-count'),
            accuracy: document.getElementById('accuracy'),
            streak: document.getElementById('streak'),
            shareStreak: document.getElementById('share-streak')
        };
    }

    bindEvents() {
        this.elements.nextRound.addEventListener('click', () => this.startNewRound());
        this.elements.newGame.addEventListener('click', () => this.resetGame());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.tempToggle.addEventListener('click', () => this.toggleTemperatureUnit());
        this.elements.apiStatus.addEventListener('click', () => this.checkAPIStatus());
        this.elements.shareStreak.addEventListener('click', () => this.shareStreak());
        
        // Welcome dialog events
        this.elements.closeWelcome.addEventListener('click', () => this.hideWelcomeDialog());
        this.elements.startPlaying.addEventListener('click', () => this.hideWelcomeDialog());
        
        // Close dialog when clicking outside content
        this.elements.welcomeDialog.addEventListener('click', (e) => {
            if (e.target === this.elements.welcomeDialog) {
                this.hideWelcomeDialog();
            }
        });
    }

    async startNewRound() {
        this.showLoading(true);
        this.gameState = 'loading';
        this.elements.feedback.classList.add('hidden');
        this.elements.nextRound.classList.add('hidden');
        
        try {
            // Select random city
            this.currentCity = this.getRandomCity();
            this.elements.cityName.textContent = `${this.currentCity.name}, ${this.currentCity.country}`;
            
            // Load city image and weather data in parallel
            const [imageUrl, weatherData] = await Promise.all([
                this.getCityImage(this.currentCity.name),
                this.getWeatherData(this.currentCity.lat, this.currentCity.lon)
            ]);
            
            this.elements.cityImage.src = imageUrl;
            this.elements.cityImage.alt = `${this.currentCity.name} cityscape`;
            
            this.currentWeather = weatherData;
            this.generateChoices();
            this.gameState = 'waiting';
            
        } catch (error) {
            console.error('Error starting new round:', error);
            this.showError('Failed to load round data. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    getRandomCity() {
        return CITIES[Math.floor(Math.random() * CITIES.length)];
    }

    async getWeatherData(lat, lon) {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            high: Math.round(data.daily.temperature_2m_max[0]),
            low: Math.round(data.daily.temperature_2m_min[0])
        };
    }

    async getCityImage(cityName) {
        try {
            // Search for city images on Wikimedia Commons
            const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(cityName + ' city skyline')}&srnamespace=6&srlimit=5&origin=*`;
            
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            
            if (searchData.query.search.length > 0) {
                // Get the first image file info
                const fileName = searchData.query.search[0].title;
                const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=400&origin=*`;
                
                const imageResponse = await fetch(imageInfoUrl);
                const imageData = await imageResponse.json();
                
                const pages = Object.values(imageData.query.pages);
                if (pages[0].imageinfo && pages[0].imageinfo[0].thumburl) {
                    return pages[0].imageinfo[0].thumburl;
                }
            }
        } catch (error) {
            console.error('Error fetching city image:', error);
        }
        
        // Fallback to a placeholder image
        return `https://via.placeholder.com/400x250/4a90e2/ffffff?text=${encodeURIComponent(cityName)}`;
    }

    generateChoices() {
        const correctHigh = this.currentWeather.high;
        const correctLow = this.currentWeather.low;
        
        // Generate 3 incorrect but plausible alternatives
        const choices = [
            { high: correctHigh, low: correctLow, correct: true }
        ];
        
        // Generate plausible incorrect choices
        const variations = [];
        const correctSpread = correctHigh - correctLow;
        
        for (let i = 0; i < 3; i++) {
            // Shift both temperatures by the same amount to maintain realistic spread
            const tempShift = this.getRandomVariation();
            let high = correctHigh + tempShift;
            let low = correctLow + tempShift;
            
            // Add small individual variations (±3 degrees) to make spreads slightly different
            const highVariation = Math.floor(Math.random() * 7) - 3; // -3 to +3
            const lowVariation = Math.floor(Math.random() * 7) - 3;
            
            high += highVariation;
            low += lowVariation;
            
            // Ensure low is never higher than high and spread isn't too extreme
            if (low > high) {
                [low, high] = [high, low];
            }
            
            // Cap the spread at 25 degrees to keep it realistic
            const spread = high - low;
            if (spread > 25) {
                const excess = spread - 25;
                high -= Math.floor(excess / 2);
                low += Math.ceil(excess / 2);
            }
            
            variations.push({ high, low });
        }
        
        choices.push(...variations);
        
        // Shuffle choices
        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        
        this.correctAnswer = choices.findIndex(choice => choice.correct);
        this.renderChoices(choices);
    }

    getRandomVariation() {
        // Generate temperature variations between -15 and +15 degrees
        const variations = [-15, -12, -10, -8, -6, -4, -2, 2, 4, 6, 8, 10, 12, 15];
        return variations[Math.floor(Math.random() * variations.length)];
    }

    renderChoices(choices) {
        this.elements.choices.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const choiceElement = document.createElement('div');
            choiceElement.className = 'choice';
            choiceElement.innerHTML = `
                <div>High: ${this.formatTemperature(choice.high)}</div>
                <div>Low: ${this.formatTemperature(choice.low)}</div>
            `;
            
            choiceElement.addEventListener('click', () => this.selectChoice(index, choiceElement));
            this.elements.choices.appendChild(choiceElement);
        });
    }

    formatTemperature(temp) {
        if (this.gameStats.isMetric) {
            return `${temp}°C`;
        } else {
            return `${Math.round(temp * 9/5 + 32)}°F`;
        }
    }

    selectChoice(selectedIndex, choiceElement) {
        if (this.gameState !== 'waiting') return;
        
        this.gameState = 'answered';
        
        // Mark all choices as disabled and show correct/incorrect
        const allChoices = this.elements.choices.querySelectorAll('.choice');
        allChoices.forEach((choice, index) => {
            choice.style.pointerEvents = 'none';
            if (index === this.correctAnswer) {
                choice.classList.add('correct');
            } else if (index === selectedIndex) {
                choice.classList.add('incorrect');
            }
        });
        
        const isCorrect = selectedIndex === this.correctAnswer;
        this.updateStats(isCorrect);
        this.showFeedback(isCorrect);
        this.elements.nextRound.classList.remove('hidden');
    }

    updateStats(isCorrect) {
        if (isCorrect) {
            this.gameStats.correct++;
            this.gameStats.streak++;
        } else {
            this.gameStats.streak = 0;
        }
        
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        // Increment round for next round first
        this.gameStats.round++;
        
        this.elements.roundCount.textContent = this.gameStats.round;
        this.elements.correctCount.textContent = this.gameStats.correct;
        
        const accuracy = this.gameStats.correct > 0 ? 
            Math.round((this.gameStats.correct / (this.gameStats.round - 1)) * 100) : 0;
        this.elements.accuracy.textContent = `${accuracy}%`;
        
        this.elements.streak.textContent = this.gameStats.streak;
    }

    showFeedback(isCorrect) {
        this.elements.feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        
        if (isCorrect) {
            this.elements.feedback.textContent = '🎉 Correct! Great guess!';
        } else {
            const correctTemp = this.formatTemperature(this.currentWeather.high) + ' / ' + this.formatTemperature(this.currentWeather.low);
            this.elements.feedback.textContent = `❌ Incorrect. The correct answer was ${correctTemp}`;
        }
        
        this.elements.feedback.classList.remove('hidden');
    }

    resetGame() {
        this.gameStats = {
            round: 1,
            correct: 0,
            streak: 0,
            isMetric: this.gameStats.isMetric // Preserve temperature unit preference
        };
        this.elements.tempToggle.textContent = this.gameStats.isMetric ? '°F' : '°C';
        
        // Update display without incrementing round
        this.elements.roundCount.textContent = this.gameStats.round;
        this.elements.correctCount.textContent = this.gameStats.correct;
        this.elements.accuracy.textContent = '0%';
        this.elements.streak.textContent = this.gameStats.streak;
        
        this.startNewRound();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.elements.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌓';
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.elements.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌓';
    }

    initializeTemperatureToggle() {
        this.elements.tempToggle.textContent = this.gameStats.isMetric ? '°F' : '°C';
    }

    toggleTemperatureUnit() {
        this.gameStats.isMetric = !this.gameStats.isMetric;
        this.elements.tempToggle.textContent = this.gameStats.isMetric ? '°F' : '°C';
        
        // Start a new game when temperature unit is toggled
        this.resetGame();
    }

    getChoiceDataByIndex(index) {
        // Reconstruct choice data - in a real implementation, you'd store this
        const correctHigh = this.currentWeather.high;
        const correctLow = this.currentWeather.low;
        
        if (index === this.correctAnswer) {
            return { high: correctHigh, low: correctLow };
        }
        
        // For simplicity, return approximate values for incorrect choices
        return { 
            high: correctHigh + this.getRandomVariation(), 
            low: correctLow + this.getRandomVariation() 
        };
    }

    async checkAPIStatus() {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'api-status';
        statusDiv.innerHTML = '<h4>Checking API Status...</h4>';
        document.body.appendChild(statusDiv);
        
        try {
            // Test Open-Meteo API
            const weatherTest = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&daily=temperature_2m_max&forecast_days=1');
            const weatherStatus = weatherTest.ok ? '✅' : '❌';
            
            // Test Wikimedia Commons API
            const wikiTest = await fetch('https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=London&srnamespace=6&srlimit=1&origin=*');
            const wikiStatus = wikiTest.ok ? '✅' : '❌';
            
            statusDiv.innerHTML = `
                <h4>API Status</h4>
                <p>${weatherStatus} Open-Meteo Weather API</p>
                <p>${wikiStatus} Wikimedia Commons API</p>
            `;
            statusDiv.className = weatherTest.ok && wikiTest.ok ? 'api-status success' : 'api-status error';
            
        } catch (error) {
            statusDiv.innerHTML = `
                <h4>API Status</h4>
                <p>❌ Connection Error</p>
                <p>Check your internet connection</p>
            `;
            statusDiv.className = 'api-status error';
        }
        
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 5000);
    }

    showLoading(show) {
        if (show) {
            this.elements.loading.classList.remove('hidden');
            this.elements.gameContainer.style.opacity = '0.5';
        } else {
            this.elements.loading.classList.add('hidden');
            this.elements.gameContainer.style.opacity = '1';
        }
    }

    showError(message) {
        this.elements.feedback.className = 'feedback incorrect';
        this.elements.feedback.textContent = message;
        this.elements.feedback.classList.remove('hidden');
        this.elements.nextRound.classList.remove('hidden');
    }

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('weathrguessr-visited');
        if (!hasVisited) {
            this.showWelcomeDialog();
        }
    }

    showWelcomeDialog() {
        this.elements.welcomeDialog.classList.remove('hidden');
    }

    hideWelcomeDialog() {
        this.elements.welcomeDialog.classList.add('hidden');
        localStorage.setItem('weathrguessr-visited', 'true');
    }

    async shareStreak() {
        const completedRounds = this.gameStats.round - 1;
        const accuracy = completedRounds > 0 ? 
            Math.round((this.gameStats.correct / completedRounds) * 100) : 0;
        
        const shareText = `🌍 WeathrGuessr Results 🌍

📊 Completed Rounds: ${completedRounds}
✅ Correct Answers: ${this.gameStats.correct}
🎯 Accuracy: ${accuracy}%
🔥 Current Streak: ${this.gameStats.streak}

Think you can beat my score? Play at https://weathrguessr.com`;

        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(shareText);
                this.showShareFeedback('✅ Results copied to clipboard!');
                return;
            } catch (error) {
                console.error('Clipboard API failed:', error);
            }
        }

        // Fallback: create text area for manual copy
        this.showShareDialog(shareText);
    }

    showShareDialog(shareText) {
        const dialog = document.createElement('div');
        dialog.className = 'share-dialog';
        dialog.innerHTML = `
            <div class="share-dialog-content">
                <div class="share-dialog-header">
                    <h3>📊 Share Your Results</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="share-dialog-body">
                    <p>Copy the text below to share your results:</p>
                    <textarea readonly class="share-text">${shareText}</textarea>
                    <button class="btn btn-primary copy-btn">📋 Copy to Clipboard</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Auto-select the text
        const textarea = dialog.querySelector('.share-text');
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        // Close dialog events
        const closeBtn = dialog.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => document.body.removeChild(dialog));
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        });
        
        // Copy button event
        const copyBtn = dialog.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            textarea.select();
            try {
                document.execCommand('copy');
                this.showShareFeedback('✅ Results copied to clipboard!');
                document.body.removeChild(dialog);
            } catch (error) {
                this.showShareFeedback('❌ Please copy the text manually');
            }
        });
    }

    showShareFeedback(message) {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'share-feedback';
        feedbackElement.textContent = message;
        document.body.appendChild(feedbackElement);

        setTimeout(() => {
            if (feedbackElement.parentNode) {
                feedbackElement.parentNode.removeChild(feedbackElement);
            }
        }, 3000);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WeatherGuessr();
});