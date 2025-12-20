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
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        // No menu buttons for this module
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

