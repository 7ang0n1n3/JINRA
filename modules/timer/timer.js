/**
 * Timer Module
 * Multiple timers with start/stop functionality and notes
 */

class Timer {
    constructor() {
        this.name = 'Timer';
        this.description = 'Multiple timers with start/stop controls';
        this.timers = [
            { id: 1, elapsed: 0, running: false, interval: null, note: '' },
            { id: 2, elapsed: 0, running: false, interval: null, note: '' },
            { id: 3, elapsed: 0, running: false, interval: null, note: '' }
        ];
        this.startTime = [null, null, null];
        this.countdownTimers = [
            { id: 1, hours: 0, minutes: 0, seconds: 0, remaining: 0, running: false, interval: null, note: '', ended: false, blinkInterval: null },
            { id: 2, hours: 0, minutes: 0, seconds: 0, remaining: 0, running: false, interval: null, note: '', ended: false, blinkInterval: null },
            { id: 3, hours: 0, minutes: 0, seconds: 0, remaining: 0, running: false, interval: null, note: '', ended: false, blinkInterval: null }
        ];
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('Timer module initialized');
        // Load saved timers from localStorage
        this.loadTimers();
        this.loadCountdownTimers();
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        // No menu buttons for this module
    }

    /**
     * Open/Activate the timer module
     */
    open() {
        this.activate();
    }

    activate() {
        const mainWindow = document.getElementById('modules-container');
        mainWindow.innerHTML = `
            <div class="module" id="module-timer">
                <div class="module-header">${this.name}</div>
                <div class="module-content">${this.render()}</div>
            </div>
        `;
        this.attachEventListeners();
        this.updateDisplays();
        this.countdownTimers.forEach(cdTimer => {
            this.updateCountdownDisplay(cdTimer.id);
            this.updateCountdownButtons(cdTimer.id);
            // Restore blinking if countdown has ended
            if (cdTimer.ended && cdTimer.remaining === 0) {
                this.startBlinking(cdTimer.id);
            }
        });
    }

    /**
     * Format time as HH:MM:SS
     */
    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Start a timer
     */
    startTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer || timer.running) return;

        timer.running = true;
        this.startTime[timerId - 1] = Date.now() - (timer.elapsed * 1000);

        timer.interval = setInterval(() => {
            const now = Date.now();
            timer.elapsed = Math.floor((now - this.startTime[timerId - 1]) / 1000);
            this.updateDisplay(timerId);
            this.saveTimers();
        }, 100);

        this.updateButtons(timerId);
    }

    /**
     * Stop a timer
     */
    stopTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer || !timer.running) return;

        timer.running = false;
        if (timer.interval) {
            clearInterval(timer.interval);
            timer.interval = null;
        }

        this.updateButtons(timerId);
        this.saveTimers();
    }

    /**
     * Reset a timer
     */
    resetTimer(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        this.stopTimer(timerId);
        timer.elapsed = 0;
        this.startTime[timerId - 1] = null;
        this.updateDisplay(timerId);
        this.saveTimers();
    }

    /**
     * Update display for a specific timer
     */
    updateDisplay(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        const displayEl = document.getElementById(`timer-display-${timerId}`);
        if (displayEl) {
            displayEl.textContent = this.formatTime(timer.elapsed);
        }
    }

    /**
     * Update all displays
     */
    updateDisplays() {
        this.timers.forEach(timer => {
            this.updateDisplay(timer.id);
        });
    }

    /**
     * Update button states
     */
    updateButtons(timerId) {
        const timer = this.timers.find(t => t.id === timerId);
        if (!timer) return;

        const startBtn = document.getElementById(`timer-start-${timerId}`);
        const stopBtn = document.getElementById(`timer-stop-${timerId}`);
        const resetBtn = document.getElementById(`timer-reset-${timerId}`);

        if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = timer.running ? '0.5' : '1';
        }
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.style.opacity = !timer.running ? '0.5' : '1';
        }
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.style.opacity = timer.running ? '0.5' : '1';
        }
    }

    /**
     * Update note for a timer
     */
    updateNote(timerId, note) {
        const timer = this.timers.find(t => t.id === timerId);
        if (timer) {
            timer.note = note;
            this.saveTimers();
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Regular timers
        this.timers.forEach(timer => {
            const timerId = timer.id;

            // Start button
            const startBtn = document.getElementById(`timer-start-${timerId}`);
            if (startBtn) {
                startBtn.addEventListener('click', () => this.startTimer(timerId));
            }

            // Stop button
            const stopBtn = document.getElementById(`timer-stop-${timerId}`);
            if (stopBtn) {
                stopBtn.addEventListener('click', () => this.stopTimer(timerId));
            }

            // Reset button
            const resetBtn = document.getElementById(`timer-reset-${timerId}`);
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetTimer(timerId));
            }

            // Note input
            const noteInput = document.getElementById(`timer-note-${timerId}`);
            if (noteInput) {
                noteInput.value = timer.note;
                noteInput.addEventListener('input', (e) => {
                    this.updateNote(timerId, e.target.value);
                });
            }
        });

        // Countdown timers
        this.countdownTimers.forEach(cdTimer => {
            const timerId = cdTimer.id;

            // Time inputs
            const hoursInput = document.getElementById(`cd-hours-${timerId}`);
            const minsInput = document.getElementById(`cd-minutes-${timerId}`);
            const secsInput = document.getElementById(`cd-seconds-${timerId}`);

            if (hoursInput) {
                hoursInput.value = cdTimer.hours;
                hoursInput.addEventListener('input', (e) => {
                    this.updateCountdownTime(timerId, 'hours', parseInt(e.target.value) || 0);
                });
            }
            if (minsInput) {
                minsInput.value = cdTimer.minutes;
                minsInput.addEventListener('input', (e) => {
                    this.updateCountdownTime(timerId, 'minutes', parseInt(e.target.value) || 0);
                });
            }
            if (secsInput) {
                secsInput.value = cdTimer.seconds;
                secsInput.addEventListener('input', (e) => {
                    this.updateCountdownTime(timerId, 'seconds', parseInt(e.target.value) || 0);
                });
            }

            // Start button
            const startBtn = document.getElementById(`cd-start-${timerId}`);
            if (startBtn) {
                startBtn.addEventListener('click', () => this.startCountdown(timerId));
            }

            // Stop button
            const stopBtn = document.getElementById(`cd-stop-${timerId}`);
            if (stopBtn) {
                stopBtn.addEventListener('click', () => this.stopCountdown(timerId));
            }

            // Reset button
            const resetBtn = document.getElementById(`cd-reset-${timerId}`);
            if (resetBtn) {
                resetBtn.addEventListener('click', () => this.resetCountdown(timerId));
            }

            // Note input
            const noteInput = document.getElementById(`cd-note-${timerId}`);
            if (noteInput) {
                noteInput.value = cdTimer.note;
                noteInput.addEventListener('input', (e) => {
                    this.updateCountdownNote(timerId, e.target.value);
                });
            }
        });
    }

    /**
     * Countdown timer methods
     */
    updateCountdownTime(timerId, field, value) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (cdTimer && !cdTimer.running) {
            cdTimer[field] = Math.max(0, Math.min(value, field === 'hours' ? 99 : 59));
            cdTimer.remaining = cdTimer.hours * 3600 + cdTimer.minutes * 60 + cdTimer.seconds;
            this.updateCountdownDisplay(timerId);
            this.saveCountdownTimers();
        }
    }

    startCountdown(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer) return;
        
        // If already running, do nothing
        if (cdTimer.running) return;

        // Calculate remaining time from inputs if not set
        if (cdTimer.remaining === 0) {
            cdTimer.remaining = cdTimer.hours * 3600 + cdTimer.minutes * 60 + cdTimer.seconds;
        }

        if (cdTimer.remaining <= 0) return;

        cdTimer.running = true;

        // Clear any existing interval
        if (cdTimer.interval) {
            clearInterval(cdTimer.interval);
        }

        cdTimer.interval = setInterval(() => {
            if (cdTimer.remaining > 0) {
                cdTimer.remaining--;
                this.updateCountdownDisplay(timerId);
                this.saveCountdownTimers();
            } else {
                this.stopCountdown(timerId);
                this.startBlinking(timerId);
            }
        }, 1000);

        this.updateCountdownButtons(timerId);
    }

    stopCountdown(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer || !cdTimer.running) return;

        cdTimer.running = false;
        if (cdTimer.interval) {
            clearInterval(cdTimer.interval);
            cdTimer.interval = null;
        }

        this.updateCountdownButtons(timerId);
        this.saveCountdownTimers();
    }

    resetCountdown(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer) return;

        this.stopCountdown(timerId);
        this.stopBlinking(timerId);
        cdTimer.remaining = cdTimer.hours * 3600 + cdTimer.minutes * 60 + cdTimer.seconds;
        cdTimer.ended = false;
        this.updateCountdownDisplay(timerId);
        this.saveCountdownTimers();
    }

    updateCountdownDisplay(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer) return;

        const displayEl = document.getElementById(`cd-display-${timerId}`);
        if (displayEl) {
            displayEl.textContent = this.formatTime(cdTimer.remaining);
        }
        
        // Remove blinking from card if not ended
        if (!cdTimer.ended) {
            const cardEl = document.querySelector(`.countdown-card[data-timer-id="${timerId}"]`);
            if (cardEl) {
                cardEl.classList.remove('countdown-ended');
                cardEl.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                cardEl.style.backgroundColor = 'rgba(30, 30, 30, 0.6)';
            }
        }

        // Update input fields if not running
        if (!cdTimer.running) {
            const hours = Math.floor(cdTimer.remaining / 3600);
            const minutes = Math.floor((cdTimer.remaining % 3600) / 60);
            const seconds = cdTimer.remaining % 60;

            const hoursInput = document.getElementById(`cd-hours-${timerId}`);
            const minsInput = document.getElementById(`cd-minutes-${timerId}`);
            const secsInput = document.getElementById(`cd-seconds-${timerId}`);

            if (hoursInput) hoursInput.value = hours;
            if (minsInput) minsInput.value = minutes;
            if (secsInput) secsInput.value = seconds;
        }
    }

    updateCountdownButtons(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer) return;

        const startBtn = document.getElementById(`cd-start-${timerId}`);
        const stopBtn = document.getElementById(`cd-stop-${timerId}`);
        const resetBtn = document.getElementById(`cd-reset-${timerId}`);

        // Always enable buttons - never disable them
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = (cdTimer.running || (cdTimer.remaining <= 0 && !cdTimer.ended)) ? '0.5' : '1';
        }
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.style.opacity = !cdTimer.running ? '0.5' : '1';
        }
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.style.opacity = (cdTimer.running && !cdTimer.ended) ? '0.5' : '1';
        }
    }

    /**
     * Start blinking animation when countdown ends
     */
    startBlinking(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer) return;

        cdTimer.ended = true;
        const cardEl = document.querySelector(`.countdown-card[data-timer-id="${timerId}"]`);
        
        if (cardEl) {
            cardEl.classList.add('countdown-ended');
        }

        // Blink between red border and original color
        let isRed = false;
        if (cdTimer.blinkInterval) {
            clearInterval(cdTimer.blinkInterval);
        }
        cdTimer.blinkInterval = setInterval(() => {
            if (cardEl) {
                isRed = !isRed;
                cardEl.style.borderColor = isRed ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                cardEl.style.backgroundColor = isRed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 30, 30, 0.6)';
            }
        }, 500);
    }

    /**
     * Stop blinking animation
     */
    stopBlinking(timerId) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (!cdTimer) return;

        if (cdTimer.blinkInterval) {
            clearInterval(cdTimer.blinkInterval);
            cdTimer.blinkInterval = null;
        }

        const cardEl = document.querySelector(`.countdown-card[data-timer-id="${timerId}"]`);
        if (cardEl) {
            cardEl.classList.remove('countdown-ended');
            cardEl.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            cardEl.style.backgroundColor = 'rgba(30, 30, 30, 0.6)';
        }
    }

    updateCountdownNote(timerId, note) {
        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (cdTimer) {
            cdTimer.note = note;
            this.saveCountdownTimers();
        }
    }

    /**
     * Save timers to localStorage
     */
    saveTimers() {
        const data = this.timers.map(t => ({
            id: t.id,
            elapsed: t.elapsed,
            note: t.note
        }));
        localStorage.setItem('timer-module-data', JSON.stringify(data));
    }

    /**
     * Load timers from localStorage
     */
    loadTimers() {
        try {
            const data = localStorage.getItem('timer-module-data');
            if (data) {
                const saved = JSON.parse(data);
                saved.forEach(savedTimer => {
                    const timer = this.timers.find(t => t.id === savedTimer.id);
                    if (timer) {
                        timer.elapsed = savedTimer.elapsed || 0;
                        timer.note = savedTimer.note || '';
                    }
                });
            }
        } catch (e) {
            console.error('Error loading timer data:', e);
        }
    }

    /**
     * Save countdown timers to localStorage
     */
    saveCountdownTimers() {
        const data = this.countdownTimers.map(t => ({
            id: t.id,
            hours: t.hours,
            minutes: t.minutes,
            seconds: t.seconds,
            remaining: t.remaining,
            note: t.note
        }));
        localStorage.setItem('countdown-timer-module-data', JSON.stringify(data));
    }

    /**
     * Load countdown timers from localStorage
     */
    loadCountdownTimers() {
        try {
            const data = localStorage.getItem('countdown-timer-module-data');
            if (data) {
                const saved = JSON.parse(data);
                saved.forEach(savedTimer => {
                    const cdTimer = this.countdownTimers.find(t => t.id === savedTimer.id);
                    if (cdTimer) {
                        cdTimer.hours = savedTimer.hours || 0;
                        cdTimer.minutes = savedTimer.minutes || 0;
                        cdTimer.seconds = savedTimer.seconds || 0;
                        cdTimer.remaining = savedTimer.remaining || (cdTimer.hours * 3600 + cdTimer.minutes * 60 + cdTimer.seconds);
                        cdTimer.note = savedTimer.note || '';
                    }
                });
            }
        } catch (e) {
            console.error('Error loading countdown timer data:', e);
        }
    }

    /**
     * Render the module content
     */
    render() {
        return `
            <div class="timer-wrapper">
                <div class="timer-container">
                    ${this.timers.map(timer => `
                        <div class="timer-card">
                            <div class="timer-header">
                                <h3>Timer ${timer.id}</h3>
                            </div>
                            <div class="timer-note-section">
                                <label for="timer-note-${timer.id}">Note:</label>
                                <input 
                                    type="text" 
                                    id="timer-note-${timer.id}" 
                                    class="timer-note-input" 
                                    placeholder="Add a note for this timer..."
                                    value="${this.escapeHtml(timer.note)}"
                                />
                            </div>
                            <div class="timer-display-section">
                                <div class="timer-display" id="timer-display-${timer.id}">00:00:00</div>
                            </div>
                            <div class="timer-controls">
                                <button 
                                    id="timer-start-${timer.id}" 
                                    class="timer-btn timer-btn-start"
                                >Start</button>
                                <button 
                                    id="timer-stop-${timer.id}" 
                                    class="timer-btn timer-btn-stop"
                                >Stop</button>
                                <button 
                                    id="timer-reset-${timer.id}" 
                                    class="timer-btn timer-btn-reset"
                                >Reset</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="timer-container countdown-container">
                    ${this.countdownTimers.map(cdTimer => `
                        <div class="timer-card countdown-card" data-timer-id="${cdTimer.id}">
                            <div class="timer-header">
                                <h3>Countdown ${cdTimer.id}</h3>
                            </div>
                            <div class="timer-note-section">
                                <label for="cd-note-${cdTimer.id}">Note:</label>
                                <input 
                                    type="text" 
                                    id="cd-note-${cdTimer.id}" 
                                    class="timer-note-input" 
                                    placeholder="Add a note for this countdown..."
                                    value="${this.escapeHtml(cdTimer.note)}"
                                />
                            </div>
                            <div class="countdown-time-inputs">
                                <div class="time-input-group">
                                    <label>H</label>
                                    <input 
                                        type="number" 
                                        id="cd-hours-${cdTimer.id}" 
                                        class="time-input" 
                                        min="0" 
                                        max="99" 
                                        value="${cdTimer.hours}"
                                    />
                                </div>
                                <span class="time-separator">:</span>
                                <div class="time-input-group">
                                    <label>M</label>
                                    <input 
                                        type="number" 
                                        id="cd-minutes-${cdTimer.id}" 
                                        class="time-input" 
                                        min="0" 
                                        max="59" 
                                        value="${cdTimer.minutes}"
                                    />
                                </div>
                                <span class="time-separator">:</span>
                                <div class="time-input-group">
                                    <label>S</label>
                                    <input 
                                        type="number" 
                                        id="cd-seconds-${cdTimer.id}" 
                                        class="time-input" 
                                        min="0" 
                                        max="59" 
                                        value="${cdTimer.seconds}"
                                    />
                                </div>
                            </div>
                            <div class="timer-display-section">
                                <div class="timer-display" id="cd-display-${cdTimer.id}">${this.formatTime(cdTimer.remaining || (cdTimer.hours * 3600 + cdTimer.minutes * 60 + cdTimer.seconds))}</div>
                            </div>
                            <div class="timer-controls">
                                <button 
                                    id="cd-start-${cdTimer.id}" 
                                    class="timer-btn timer-btn-start"
                                >Start</button>
                                <button 
                                    id="cd-stop-${cdTimer.id}" 
                                    class="timer-btn timer-btn-stop"
                                >Stop</button>
                                <button 
                                    id="cd-reset-${cdTimer.id}" 
                                    class="timer-btn timer-btn-reset"
                                >Reset</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export the module class - must match the module directory name
window.timer = Timer;

