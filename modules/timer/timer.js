/**
 * Timer Module
 * Multiple timers with start/stop functionality and notes
 */

class Timer {
    constructor() {
        this.name = 'Timer';
        this.description = 'Multiple timers with start/stop controls';
        this.timers = [];
        this.startTime = {};
        this.countdownTimers = [];
        this.nextTimerId = 1;
        this.nextCountdownId = 1;
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('Timer module initialized');
        // Load saved timers from localStorage
        this.loadTimers();
        this.loadCountdownTimers();
        // Register menu bar buttons
        this.registerMenuButtons();
    }

    /**
     * Register menu bar buttons
     */
    registerMenuButton() {
        this.registerMenuButtons();
    }

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

        // Remove existing buttons if they exist (to avoid duplicates)
        const existingTimerBtn = document.getElementById('timer-create-timer-btn');
        const existingCountdownBtn = document.getElementById('timer-create-countdown-btn');
        if (existingTimerBtn && existingTimerBtn.parentNode) {
            existingTimerBtn.parentNode.removeChild(existingTimerBtn);
        }
        if (existingCountdownBtn && existingCountdownBtn.parentNode) {
            existingCountdownBtn.parentNode.removeChild(existingCountdownBtn);
        }

        // Create "Create New Timer" button
        const createTimerBtn = document.createElement('button');
        createTimerBtn.id = 'timer-create-timer-btn';
        createTimerBtn.className = 'menu-bar-button';
        createTimerBtn.textContent = 'Create New Timer';
        createTimerBtn.style.display = 'none';
        createTimerBtn.addEventListener('click', () => {
            this.createNewTimer();
        });
        menuContent.appendChild(createTimerBtn);

        // Create "Create New Countdown" button
        const createCountdownBtn = document.createElement('button');
        createCountdownBtn.id = 'timer-create-countdown-btn';
        createCountdownBtn.className = 'menu-bar-button';
        createCountdownBtn.textContent = 'Create New Countdown';
        createCountdownBtn.style.display = 'none';
        createCountdownBtn.addEventListener('click', () => {
            this.createNewCountdown();
        });
        menuContent.appendChild(createCountdownBtn);
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        // Make sure buttons are registered first
        this.registerMenuButtons();
        
        const createTimerBtn = document.getElementById('timer-create-timer-btn');
        const createCountdownBtn = document.getElementById('timer-create-countdown-btn');
        
        if (createTimerBtn) {
            createTimerBtn.style.display = show ? 'inline-block' : 'none';
        }
        if (createCountdownBtn) {
            createCountdownBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    /**
     * Create a new timer
     */
    createNewTimer() {
        const name = prompt('Enter a name for the new timer:', `Timer ${this.nextTimerId}`);
        if (name === null) return; // User cancelled

        const timerId = this.nextTimerId++;
        const newTimer = {
            id: timerId,
            name: name || `Timer ${timerId}`,
            elapsed: 0,
            running: false,
            interval: null,
            note: ''
        };
        
        this.timers.push(newTimer);
        this.startTime[timerId] = null;
        this.saveTimers();
        this.renderAndAttach();
    }

    /**
     * Create a new countdown timer
     */
    createNewCountdown() {
        const name = prompt('Enter a name for the new countdown:', `Countdown ${this.nextCountdownId}`);
        if (name === null) return; // User cancelled

        const countdownId = this.nextCountdownId++;
        const newCountdown = {
            id: countdownId,
            name: name || `Countdown ${countdownId}`,
            hours: 0,
            minutes: 0,
            seconds: 0,
            remaining: 0,
            running: false,
            interval: null,
            note: '',
            ended: false,
            blinkInterval: null
        };
        
        this.countdownTimers.push(newCountdown);
        this.saveCountdownTimers();
        this.renderAndAttach();
    }

    /**
     * Delete a timer
     */
    deleteTimer(timerId) {
        if (!confirm('Are you sure you want to delete this timer?')) return;

        const timer = this.timers.find(t => t.id === timerId);
        if (timer && timer.running) {
            this.stopTimer(timerId);
        }

        this.timers = this.timers.filter(t => t.id !== timerId);
        delete this.startTime[timerId];
        this.saveTimers();
        this.renderAndAttach();
    }

    /**
     * Delete a countdown timer
     */
    deleteCountdown(timerId) {
        if (!confirm('Are you sure you want to delete this countdown?')) return;

        const cdTimer = this.countdownTimers.find(t => t.id === timerId);
        if (cdTimer) {
            if (cdTimer.running) {
                this.stopCountdown(timerId);
            }
            if (cdTimer.ended) {
                this.stopBlinking(timerId);
            }
        }

        this.countdownTimers = this.countdownTimers.filter(t => t.id !== timerId);
        this.saveCountdownTimers();
        this.renderAndAttach();
    }

    /**
     * Render and attach event listeners
     */
    renderAndAttach() {
        const mainWindow = document.getElementById('modules-container');
        const moduleContent = mainWindow.querySelector('.module-content');
        if (moduleContent) {
            // Set global reference for onclick handlers
            window.timer = this;
            moduleContent.innerHTML = this.render();
            this.attachEventListeners();
            this.updateDisplays();
            
            // Update all button states
            this.timers.forEach(timer => {
                this.updateButtons(timer.id);
            });
            
            this.countdownTimers.forEach(cdTimer => {
                this.updateCountdownDisplay(cdTimer.id);
                this.updateCountdownButtons(cdTimer.id);
                if (cdTimer.ended && cdTimer.remaining === 0) {
                    this.startBlinking(cdTimer.id);
                }
            });
        }
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
        // Set global reference for onclick handlers
        window.timer = this;
        // Register and show menu buttons
        this.registerMenuButtons();
        this.toggleMenuButtons(true);
        this.attachEventListeners();
        this.updateDisplays();
        
        // Update all button states
        this.timers.forEach(timer => {
            this.updateButtons(timer.id);
        });
        
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
        this.startTime[timerId] = Date.now() - (timer.elapsed * 1000);

        timer.interval = setInterval(() => {
            const now = Date.now();
            timer.elapsed = Math.floor((now - this.startTime[timerId]) / 1000);
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
            name: t.name,
            elapsed: t.elapsed,
            note: t.note
        }));
        localStorage.setItem('timer-module-data', JSON.stringify(data));
        localStorage.setItem('timer-next-id', this.nextTimerId.toString());
    }

    /**
     * Load timers from localStorage
     */
    loadTimers() {
        try {
            const nextId = localStorage.getItem('timer-next-id');
            if (nextId) {
                this.nextTimerId = parseInt(nextId, 10);
            }
            
            const data = localStorage.getItem('timer-module-data');
            if (data) {
                const saved = JSON.parse(data);
                this.timers = saved.map(savedTimer => ({
                    id: savedTimer.id,
                    name: savedTimer.name || `Timer ${savedTimer.id}`,
                    elapsed: savedTimer.elapsed || 0,
                    running: false,
                    interval: null,
                    note: savedTimer.note || ''
                }));
                
                // Initialize startTime for all loaded timers
                this.timers.forEach(timer => {
                    this.startTime[timer.id] = null;
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
            name: t.name,
            hours: t.hours,
            minutes: t.minutes,
            seconds: t.seconds,
            remaining: t.remaining,
            note: t.note
        }));
        localStorage.setItem('countdown-timer-module-data', JSON.stringify(data));
        localStorage.setItem('countdown-next-id', this.nextCountdownId.toString());
    }

    /**
     * Load countdown timers from localStorage
     */
    loadCountdownTimers() {
        try {
            const nextId = localStorage.getItem('countdown-next-id');
            if (nextId) {
                this.nextCountdownId = parseInt(nextId, 10);
            }
            
            const data = localStorage.getItem('countdown-timer-module-data');
            if (data) {
                const saved = JSON.parse(data);
                this.countdownTimers = saved.map(savedTimer => ({
                    id: savedTimer.id,
                    name: savedTimer.name || `Countdown ${savedTimer.id}`,
                    hours: savedTimer.hours || 0,
                    minutes: savedTimer.minutes || 0,
                    seconds: savedTimer.seconds || 0,
                    remaining: savedTimer.remaining || (savedTimer.hours * 3600 + savedTimer.minutes * 60 + savedTimer.seconds),
                    running: false,
                    interval: null,
                    note: savedTimer.note || '',
                    ended: false,
                    blinkInterval: null
                }));
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
                                <h3>${this.escapeHtml(timer.name || `Timer ${timer.id}`)}</h3>
                                <button 
                                    class="timer-delete-btn" 
                                    onclick="window.timer.deleteTimer(${timer.id})"
                                    title="Delete Timer"
                                >×</button>
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
                                <h3>${this.escapeHtml(cdTimer.name || `Countdown ${cdTimer.id}`)}</h3>
                                <button 
                                    class="timer-delete-btn" 
                                    onclick="window.timer.deleteCountdown(${cdTimer.id})"
                                    title="Delete Countdown"
                                >×</button>
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

