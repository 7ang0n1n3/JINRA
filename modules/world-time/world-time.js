/**
 * World Time Module
 * Displays current time in multiple time zones around the world
 */

class WorldTime {
    constructor() {
        this.name = 'World Time';
        this.description = 'View current time in multiple time zones';
        this.timeZones = [
            { name: 'UTC', tz: 'UTC' },
            { name: 'New York', tz: 'America/New_York' },
            { name: 'London', tz: 'Europe/London' },
            { name: 'Tokyo', tz: 'Asia/Tokyo' },
            { name: 'Sydney', tz: 'Australia/Sydney' },
            { name: 'Los Angeles', tz: 'America/Los_Angeles' },
            { name: 'Paris', tz: 'Europe/Paris' },
            { name: 'Dubai', tz: 'Asia/Dubai' },
            { name: 'Mumbai', tz: 'Asia/Kolkata' }
        ];
        this.updateInterval = null;
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('World Time module initialized');
        this.registerMenuButtons();
    }

    /**
     * Register menu bar buttons
     */
    registerMenuButtons() {
        const menuBar = document.getElementById('menu-bar');
        if (!menuBar) return;
        
        const menuContent = menuBar.querySelector('.menu-bar-content');
        if (!menuContent) return;
        
        // Setup menu bar container if not already done
        if (!menuContent.classList.contains('menu-bar-container-setup')) {
            menuContent.innerHTML = '';
            menuContent.classList.add('menu-bar-container-setup');
            menuContent.style.display = 'flex';
            menuContent.style.gap = '10px';
            menuContent.style.alignItems = 'center';
            menuContent.style.justifyContent = 'flex-start';
            menuContent.style.padding = '0 20px';
        }

        // Remove existing button if it exists
        const existingBtn = document.getElementById('wt-converter-btn');
        if (existingBtn && existingBtn.parentNode) {
            existingBtn.parentNode.removeChild(existingBtn);
        }

        // Create "Time Converter" button
        const converterBtn = document.createElement('button');
        converterBtn.id = 'wt-converter-btn';
        converterBtn.className = 'menu-bar-button';
        converterBtn.textContent = 'Time Converter';
        converterBtn.style.display = 'none';
        converterBtn.addEventListener('click', () => {
            this.openConverter();
        });
        menuContent.appendChild(converterBtn);
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        const converterBtn = document.getElementById('wt-converter-btn');
        if (converterBtn) {
            converterBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    /**
     * Open/Activate the world time module
     */
    open() {
        this.activate();
    }

    activate() {
        const mainWindow = document.getElementById('modules-container');
        mainWindow.innerHTML = `
            <div class="module" id="module-world-time">
                <div class="module-header">${this.name}</div>
                <div class="module-content">${this.render()}</div>
            </div>
        `;
        this.toggleMenuButtons(true);
        this.startClock();
    }

    /**
     * Format time for a timezone
     */
    formatTime(date, timeZone) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: timeZone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }).format(date);
        } catch (e) {
            return 'N/A';
        }
    }

    /**
     * Format date for a timezone
     */
    formatDate(date, timeZone) {
        try {
            return new Intl.DateTimeFormat('en-US', {
                timeZone: timeZone,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            }).format(date);
        } catch (e) {
            return 'N/A';
        }
    }

    /**
     * Get timezone offset
     */
    getTimezoneOffset(timeZone) {
        try {
            const now = new Date();
            const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tz = new Date(now.toLocaleString('en-US', { timeZone: timeZone }));
            const offset = (tz - utc) / (1000 * 60 * 60); // hours
            const sign = offset >= 0 ? '+' : '';
            return `UTC${sign}${offset}`;
        } catch (e) {
            return '';
        }
    }

    /**
     * Update all clocks
     */
    updateClocks() {
        const now = new Date();
        this.timeZones.forEach((tz, index) => {
            const timeEl = document.getElementById(`world-time-${index}`);
            const dateEl = document.getElementById(`world-date-${index}`);
            const offsetEl = document.getElementById(`world-offset-${index}`);
            
            if (timeEl) {
                timeEl.textContent = this.formatTime(now, tz.tz);
            }
            if (dateEl) {
                dateEl.textContent = this.formatDate(now, tz.tz);
            }
            if (offsetEl) {
                offsetEl.textContent = this.getTimezoneOffset(tz.tz);
            }
        });
    }

    /**
     * Start the clock update interval
     */
    startClock() {
        // Update immediately
        this.updateClocks();
        
        // Update every second
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => {
            this.updateClocks();
        }, 1000);
    }

    /**
     * Stop the clock update interval
     */
    stopClock() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    /**
     * Open timezone converter modal
     */
    openConverter() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'wt-converter-modal';
        modal.className = 'wt-modal-overlay';
        modal.innerHTML = `
            <div class="wt-modal-content">
                <div class="wt-modal-header">
                    <h2>Timezone Converter</h2>
                    <button class="wt-modal-close" id="wt-converter-close">&times;</button>
                </div>
                <div class="wt-modal-body">
                    <div class="wt-converter-form">
                        <div class="wt-converter-row">
                            <div class="wt-converter-field">
                                <label for="wt-source-time">Date & Time:</label>
                                <input type="datetime-local" id="wt-source-time" />
                            </div>
                        </div>
                        <div class="wt-converter-row">
                            <div class="wt-converter-field">
                                <label for="wt-source-tz">From Timezone:</label>
                                <select id="wt-source-tz">
                                    ${this.timeZones.map(tz => 
                                        `<option value="${tz.tz}">${tz.name} (${tz.tz})</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="wt-converter-arrow">→</div>
                            <div class="wt-converter-field">
                                <label for="wt-target-tz">To Timezone:</label>
                                <select id="wt-target-tz">
                                    ${this.timeZones.map(tz => 
                                        `<option value="${tz.tz}">${tz.name} (${tz.tz})</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="wt-converter-row">
                            <button id="wt-convert-btn" class="wt-convert-button">Convert</button>
                        </div>
                        <div class="wt-converter-result" id="wt-converter-result" style="display: none;">
                            <div class="wt-result-label">Converted Time:</div>
                            <div class="wt-result-time" id="wt-result-time"></div>
                            <div class="wt-result-date" id="wt-result-date"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Set default time to now
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('wt-source-time').value = localDateTime;

        // Close button
        document.getElementById('wt-converter-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Convert button
        document.getElementById('wt-convert-btn').addEventListener('click', () => {
            this.performConversion();
        });

        // Convert on Enter key in datetime input
        document.getElementById('wt-source-time').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performConversion();
            }
        });
    }

    /**
     * Perform timezone conversion
     */
    performConversion() {
        const sourceTimeInput = document.getElementById('wt-source-time').value;
        const sourceTz = document.getElementById('wt-source-tz').value;
        const targetTz = document.getElementById('wt-target-tz').value;

        if (!sourceTimeInput) {
            alert('Please enter a date and time');
            return;
        }

        try {
            // Parse the input datetime-local value (YYYY-MM-DDTHH:mm format)
            const [datePart, timePart] = sourceTimeInput.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute] = timePart.split(':').map(Number);
            
            // Create a date string in ISO format (will be interpreted as local time)
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
            const localDate = new Date(dateStr);
            
            // Get the UTC timestamp
            const utcTimestamp = localDate.getTime() - (localDate.getTimezoneOffset() * 60 * 1000);
            
            // Get what this UTC time looks like in source timezone
            const sourceDate = new Date(utcTimestamp);
            const sourceFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: sourceTz,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const sourceParts = sourceFormatter.formatToParts(sourceDate);
            const getPart = (type) => parseInt(sourceParts.find(p => p.type === type)?.value || '0');
            
            const sourceHour = getPart('hour');
            const sourceMin = getPart('minute');
            const sourceDay = getPart('day');
            
            // Calculate the difference between desired input time and what source TZ shows
            const hourDiff = hour - sourceHour;
            const minDiff = minute - sourceMin;
            let dayDiff = day - sourceDay;
            
            // Handle day rollover (could be due to timezone differences)
            if (dayDiff > 15) dayDiff -= 30; // Approximate, handle month boundary
            if (dayDiff < -15) dayDiff += 30;
            
            // Adjust the UTC timestamp
            const totalDiffMs = ((hourDiff * 60) + minDiff) * 60 * 1000 + (dayDiff * 24 * 60 * 60 * 1000);
            const adjustedUtcTimestamp = utcTimestamp + totalDiffMs;
            const adjustedDate = new Date(adjustedUtcTimestamp);
            
            // Format the adjusted date in target timezone
            const resultTime = this.formatTime(adjustedDate, targetTz);
            const resultDate = this.formatDate(adjustedDate, targetTz);
            
            // Display result
            document.getElementById('wt-result-time').textContent = resultTime;
            document.getElementById('wt-result-date').textContent = resultDate;
            document.getElementById('wt-converter-result').style.display = 'block';
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting time. Please check your input.');
        }
    }

    /**
     * Render the module content
     */
    render() {
        return `
            <div class="world-time-container">
                <div class="world-time-grid">
                    ${this.timeZones.map((tz, index) => `
                        <div class="world-time-card">
                            <div class="world-time-city">${tz.name}</div>
                            <div class="world-time-time" id="world-time-${index}">--:--:--</div>
                            <div class="world-time-date" id="world-date-${index}">--</div>
                            <div class="world-time-offset" id="world-offset-${index}">--</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Export the module class - must match the module directory name
window['world-time'] = WorldTime;
window.worldTime = WorldTime;

