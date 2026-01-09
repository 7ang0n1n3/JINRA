/**
 * OKR Tracker Module for JINRA
 * Based on ~/Lab/okr-tracker project
 * Tracks Objectives and Key Results with progress tracking
 */

class OKRTracker {
    constructor() {
        this.name = 'OKR Tracker';
        this.description = 'Track Objectives and Key Results with progress monitoring';
        this.data = { objectives: [] };
        this.dataFile = 'data/okr-data.json';
        this.fileHandle = null;
        this.FILE_HANDLE_KEY = 'okr_last_file';
        this.FILE_NAME_KEY = 'okr_last_file_name'; // localStorage key for file name
        this.isFileSystemSupported = 'showOpenFilePicker' in window;
        
        // Store instance reference for onclick handlers
        window.okrTracker = this;
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('OKR Tracker module initialized');
        await this.loadData();
        this.registerMenuButton();
        // Update file status if module is already open
        if (document.getElementById('okr-file-name')) {
            this.updateFileStatus(true);
        }
    }

    /**
     * Register buttons in the menu bar
     */
    registerMenuButton() {
        const menuBar = document.getElementById('menu-bar');
        if (!menuBar) {
            console.error('OKR Tracker: menu-bar not found');
            return;
        }
        
        let menuContent = menuBar.querySelector('.menu-bar-content');
        if (!menuContent) {
            // Create menu content if it doesn't exist
            menuContent = document.createElement('div');
            menuContent.className = 'menu-bar-content';
            menuBar.appendChild(menuContent);
        }
        
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
        
        // Remove existing OKR buttons if they exist (to avoid duplicates)
        const existingButtonIds = ['okr-menu-add-objective', 'okr-menu-open-file', 'okr-menu-new-file', 'okr-menu-export', 'okr-menu-help', 'okr-menu-trends', 'okr-menu-history'];
        existingButtonIds.forEach(btnId => {
            const existingBtn = document.getElementById(btnId);
            if (existingBtn && existingBtn.parentNode) {
                existingBtn.parentNode.removeChild(existingBtn);
            }
        });
        
        // Create buttons for OKR tracker
        const addBtn = document.createElement('button');
        addBtn.className = 'menu-bar-button';
        addBtn.textContent = '+ Add Objective';
        addBtn.id = 'okr-menu-add-objective';
        addBtn.style.display = 'none'; // Hidden until module is active
        addBtn.addEventListener('click', () => {
            this.openObjectiveModal();
        });
        menuContent.appendChild(addBtn);
        
        // Open File button (always create, but check support when clicked)
        const openBtn = document.createElement('button');
        openBtn.className = 'menu-bar-button';
        openBtn.textContent = '📂 Open File';
        openBtn.id = 'okr-menu-open-file';
        openBtn.style.display = 'none';
        openBtn.addEventListener('click', () => {
            if (this.isFileSystemSupported) {
                this.openFile();
            } else {
                alert('File System Access API is not supported in this browser. Please use a modern browser like Chrome, Edge, or Opera.');
            }
        });
        menuContent.appendChild(openBtn);
        
        const newBtn = document.createElement('button');
        newBtn.className = 'menu-bar-button';
        newBtn.textContent = '📄 New File';
        newBtn.id = 'okr-menu-new-file';
        newBtn.style.display = 'none';
        newBtn.addEventListener('click', () => {
            if (this.isFileSystemSupported) {
                this.createFile();
            } else {
                alert('File System Access API is not supported in this browser. Please use a modern browser like Chrome, Edge, or Opera.');
            }
        });
        menuContent.appendChild(newBtn);
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'menu-bar-button';
        exportBtn.textContent = '📥 Export Report';
        exportBtn.id = 'okr-menu-export';
        exportBtn.style.display = 'none'; // Hidden until module is active
        exportBtn.addEventListener('click', () => {
            this.exportToText();
        });
        menuContent.appendChild(exportBtn);
        
        const helpBtn = document.createElement('button');
        helpBtn.className = 'menu-bar-button';
        helpBtn.textContent = '❓ What is OKR?';
        helpBtn.id = 'okr-menu-help';
        helpBtn.style.display = 'none'; // Hidden until module is active
        helpBtn.addEventListener('click', () => {
            document.getElementById('okr-help-modal').classList.add('active');
        });
        menuContent.appendChild(helpBtn);

        const trendsBtn = document.createElement('button');
        trendsBtn.className = 'menu-bar-button';
        trendsBtn.textContent = '📈 Progress Trends';
        trendsBtn.id = 'okr-menu-trends';
        trendsBtn.style.display = 'none';
        trendsBtn.addEventListener('click', () => {
            this.openProgressTrendsModal();
        });
        menuContent.appendChild(trendsBtn);

        const historyBtn = document.createElement('button');
        historyBtn.className = 'menu-bar-button';
        historyBtn.textContent = '📊 View History';
        historyBtn.id = 'okr-menu-history';
        historyBtn.style.display = 'none';
        historyBtn.addEventListener('click', () => {
            this.openHistoryModal();
        });
        menuContent.appendChild(historyBtn);
        
        console.log('OKR Tracker: Menu buttons registered', {
            buttonsCreated: existingButtonIds.length,
            fileSystemSupported: this.isFileSystemSupported,
            menuContent: menuContent
        });
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        const buttons = ['okr-menu-add-objective', 'okr-menu-open-file', 'okr-menu-new-file', 'okr-menu-export', 'okr-menu-help', 'okr-menu-trends', 'okr-menu-history'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.style.display = show ? 'block' : 'none';
            } else {
                console.warn(`OKR Tracker: Button ${btnId} not found`);
            }
        });
        console.log('OKR Tracker: Menu buttons toggled', { show, buttonsFound: buttons.filter(id => document.getElementById(id)) });
    }

    /**
     * Load data from JSON file
     */
    async loadData() {
        // Try to restore last opened file first
        if (this.isFileSystemSupported) {
            const restored = await this.tryRestoreLastFile();
            if (restored) {
                return;
            }
        }
        
        // Fallback to localStorage
        try {
            const stored = localStorage.getItem('okr_data');
            if (stored) {
                this.data = JSON.parse(stored);
                return;
            }
        } catch (e) {
            console.log('No localStorage data found');
        }
        
        // Try to load from data directory as last resort
        try {
            const response = await fetch(this.dataFile);
            if (response.ok) {
                this.data = await response.json();
            } else {
                this.data = { objectives: [], history: [] };
            }
        } catch (error) {
            console.log('No existing OKR data found, starting fresh');
            this.data = { objectives: [], history: [] };
        }
        
        // Ensure history array exists
        if (!this.data.history) {
            this.data.history = [];
        }
    }

    /**
     * Save data to file (File System API or localStorage fallback)
     */
    async saveData() {
        // Save to file if file handle exists
        if (this.fileHandle) {
            await this.saveToFile();
        }
        
        // Also save to localStorage as backup
        try {
            localStorage.setItem('okr_data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    /**
     * Load data from file handle
     */
    async loadFromFile() {
        try {
            const file = await this.fileHandle.getFile();
            const text = await file.text();
            this.data = JSON.parse(text);
            // Ensure history array exists
            if (!this.data.history) {
                this.data.history = [];
            }
            // Ensure objectives array exists
            if (!this.data.objectives) {
                this.data.objectives = [];
            }
        } catch (e) {
            console.error('Failed to load from file:', e);
            this.data = { objectives: [], history: [] };
        }
    }

    /**
     * Save data to file handle
     */
    async saveToFile() {
        if (!this.fileHandle) return;
        try {
            const writable = await this.fileHandle.createWritable();
            await writable.write(JSON.stringify(this.data, null, 2));
            await writable.close();
            this.updateFileStatus(true);
        } catch (e) {
            console.error('Failed to save:', e);
            this.updateFileStatus(false);
        }
    }

    /**
     * Open existing file
     */
    async openFile() {
        if (!this.isFileSystemSupported) {
            alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
            return;
        }
        
        try {
            [this.fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            await this.loadFromFile();
            this.renderObjectives();
            this.updateFileStatus(true);
            await this.storeFileHandle();
            // Store file name in localStorage
            if (this.fileHandle && this.fileHandle.name) {
                localStorage.setItem(this.FILE_NAME_KEY, this.fileHandle.name);
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Failed to open file:', e);
            }
        }
    }

    /**
     * Create new file
     */
    async createFile() {
        if (!this.isFileSystemSupported) {
            alert('File System Access API is not supported in this browser. Please use Chrome, Edge, or Opera.');
            return;
        }
        
        try {
            this.fileHandle = await window.showSaveFilePicker({
                suggestedName: 'okr-data.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            this.data = { objectives: [], history: [] };
            await this.saveToFile();
            this.renderObjectives();
            this.updateFileStatus(true);
            await this.storeFileHandle();
            // Store file name in localStorage
            if (this.fileHandle && this.fileHandle.name) {
                localStorage.setItem(this.FILE_NAME_KEY, this.fileHandle.name);
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('Failed to create file:', e);
            }
        }
    }

    /**
     * Store file handle in IndexedDB
     */
    async storeFileHandle() {
        if (!this.fileHandle) return;
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction('fileHandles', 'readwrite');
            const store = tx.objectStore('fileHandles');
            await store.put(this.fileHandle, this.FILE_HANDLE_KEY);
        } catch (e) {
            console.error('Failed to store file handle:', e);
        }
    }

    /**
     * Retrieve file handle from IndexedDB
     */
    async retrieveFileHandle() {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction('fileHandles', 'readonly');
            const store = tx.objectStore('fileHandles');
            return new Promise((resolve, reject) => {
                const request = store.get(this.FILE_HANDLE_KEY);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to retrieve file handle:', e);
            return null;
        }
    }

    /**
     * Clear stored file handle from IndexedDB
     */
    async clearFileHandle() {
        try {
            const db = await this.openIndexedDB();
            const tx = db.transaction('fileHandles', 'readwrite');
            const store = tx.objectStore('fileHandles');
            await store.delete(this.FILE_HANDLE_KEY);
            localStorage.removeItem(this.FILE_NAME_KEY);
        } catch (e) {
            console.error('Failed to clear file handle:', e);
        }
    }

    /**
     * Open IndexedDB
     */
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('OKRTracker', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('fileHandles')) {
                    db.createObjectStore('fileHandles');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Try to restore last opened file
     */
    async tryRestoreLastFile() {
        if (!this.isFileSystemSupported) {
            return false;
        }
        
        try {
            const storedHandle = await this.retrieveFileHandle();
            if (storedHandle) {
                const permission = await storedHandle.requestPermission({ mode: 'readwrite' });
                if (permission === 'granted') {
                    this.fileHandle = storedHandle;
                    await this.loadFromFile();
                    // Update localStorage with current file name
                    if (this.fileHandle && this.fileHandle.name) {
                        localStorage.setItem(this.FILE_NAME_KEY, this.fileHandle.name);
                    }
                    // Only render if UI is already rendered (module is active)
                    if (document.getElementById('okr-objectives-list')) {
                        this.renderObjectives();
                        this.updateFileStatus(true);
                    }
                    return true;
                } else {
                    // Permission denied, clear stored handle
                    console.log('Permission denied for last file, clearing stored handle');
                    await this.clearFileHandle();
                }
            }
        } catch (e) {
            console.log('Could not restore last file:', e.message);
            // Clear invalid file handle
            await this.clearFileHandle();
        }
        return false;
    }

    /**
     * Update file status indicator
     */
    updateFileStatus(connected) {
        const fileNameEl = document.getElementById('okr-file-name');
        if (fileNameEl) {
            if (this.fileHandle) {
                fileNameEl.textContent = this.fileHandle.name;
                fileNameEl.classList.add('okr-file-connected');
            } else {
                // Try to show last file name from localStorage
                const lastFileName = localStorage.getItem(this.FILE_NAME_KEY);
                if (lastFileName) {
                    fileNameEl.textContent = `${lastFileName} (not connected)`;
                    fileNameEl.classList.remove('okr-file-connected');
                } else {
                    fileNameEl.textContent = 'No file selected';
                    fileNameEl.classList.remove('okr-file-connected');
                }
            }
        }
    }

    /**
     * Open/Activate the OKR tracker in main window
     */
    async open() {
        await this.openTracker();
    }

    async activate() {
        await this.openTracker();
    }

    /**
     * Open the OKR tracker in main window
     */
    async openTracker() {
        // Ensure global reference is set for onclick handlers
        window.okrTracker = this;
        
        const mainWindow = document.getElementById('modules-container');
        // Ensure main window content has position relative for modals
        const mainWindowContent = mainWindow.closest('.main-window-content') || mainWindow.parentElement;
        if (mainWindowContent) {
            mainWindowContent.style.position = 'relative';
        }
        
        mainWindow.innerHTML = this.render();
        this.attachEventListeners();
        
        // Try to restore last file if not already loaded
        if (this.isFileSystemSupported && !this.fileHandle) {
            const restored = await this.tryRestoreLastFile();
            if (restored) {
                // File was restored, objectives already rendered
            } else {
                // No file restored, render with existing data
                this.renderObjectives();
            }
        } else {
            // Render with existing data
            this.renderObjectives();
        }
        
        this.toggleMenuButtons(true); // Show menu bar buttons
        this.updateFileStatus(true); // Update file status display
        // Record initial progress snapshot if data exists
        if (this.data && this.data.objectives && this.data.objectives.length > 0) {
            this.recordProgressSnapshot();
        }
    }

    /**
     * Render the OKR tracker interface
     */
    render() {
        return `
            <div class="okr-tracker-container">
                <div class="okr-header">
                    <h2>🎯 OKR Tracker</h2>
                    <p class="okr-subtitle">Objectives & Key Results</p>
                    <p id="okr-file-status" class="okr-file-status-header">
                        <span class="okr-file-label">FILE:</span> 
                        <span id="okr-file-name">No file selected</span>
                    </p>
                </div>
                

                <div class="okr-dashboard-charts">
                    <div class="okr-chart-container">
                        <svg class="okr-progress-ring" viewBox="0 0 120 120">
                            <circle class="okr-ring-bg" cx="60" cy="60" r="52" />
                            <circle class="okr-ring-progress okr-ring-personal" cx="60" cy="60" r="52" />
                        </svg>
                        <div class="okr-chart-center">
                            <span class="okr-chart-count" id="okr-personal-count">0</span>
                            <span class="okr-chart-label">Personal</span>
                        </div>
                        <div class="okr-chart-percent" id="okr-personal-percent">0%</div>
                    </div>
                    <div class="okr-chart-container">
                        <svg class="okr-progress-ring" viewBox="0 0 120 120">
                            <circle class="okr-ring-bg" cx="60" cy="60" r="52" />
                            <circle class="okr-ring-progress okr-ring-team" cx="60" cy="60" r="52" />
                        </svg>
                        <div class="okr-chart-center">
                            <span class="okr-chart-count" id="okr-team-count">0</span>
                            <span class="okr-chart-label">Team</span>
                        </div>
                        <div class="okr-chart-percent" id="okr-team-percent">0%</div>
                    </div>
                    <div class="okr-chart-container">
                        <svg class="okr-progress-ring" viewBox="0 0 120 120">
                            <circle class="okr-ring-bg" cx="60" cy="60" r="52" />
                            <circle class="okr-ring-progress okr-ring-company" cx="60" cy="60" r="52" />
                        </svg>
                        <div class="okr-chart-center">
                            <span class="okr-chart-count" id="okr-company-count">0</span>
                            <span class="okr-chart-label">Company</span>
                        </div>
                        <div class="okr-chart-percent" id="okr-company-percent">0%</div>
                    </div>
                </div>

                <div class="okr-objectives-list">
                    <h3>Objectives</h3>
                    <div id="okr-objectives-container"></div>
                </div>
            </div>

            <!-- Modals will be added here -->
            ${this.renderModals()}
        `;
    }

    /**
     * Render modals for adding/editing objectives and key results
     */
    renderModals() {
        return `
            <!-- Help Modal -->
            <div id="okr-help-modal" class="okr-modal">
                <div class="okr-modal-content okr-modal-help">
                    <span class="okr-close" data-modal="okr-help-modal">&times;</span>
                    <h3>📚 What is OKR?</h3>
                    <div class="okr-help-content">
                        <p><strong>OKR</strong> stands for <strong>Objectives and Key Results</strong> — a goal-setting framework used by companies like Google, Intel, and LinkedIn to align teams and track progress.</p>
                        <h4>🎯 Objectives</h4>
                        <p>An Objective is a clearly defined goal that is:</p>
                        <ul>
                            <li><strong>Qualitative</strong> — Describes what you want to achieve</li>
                            <li><strong>Inspiring</strong> — Motivates you and your team</li>
                            <li><strong>Time-bound</strong> — Has a clear deadline (usually quarterly)</li>
                        </ul>
                        <h4>📊 Key Results</h4>
                        <p>Key Results are measurable outcomes that indicate progress toward the Objective:</p>
                        <ul>
                            <li><strong>Quantitative</strong> — Include specific numbers or metrics</li>
                            <li><strong>Measurable</strong> — You can track progress objectively</li>
                            <li><strong>Challenging</strong> — Stretch goals (70% achievement is often considered success)</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Objective Modal -->
            <div id="okr-objective-modal" class="okr-modal">
                <div class="okr-modal-content okr-modal-wide">
                    <span class="okr-close" data-modal="okr-objective-modal">&times;</span>
                    <h3 id="okr-objective-modal-title">Objective</h3>
                    <form id="okr-objective-form">
                        <input type="hidden" id="okr-objective-edit-id">
                        <div class="okr-form-row">
                            <div class="okr-form-column">
                                <div class="okr-form-field">
                                    <label>Group</label>
                                    <select id="okr-objective-group" required>
                                        <option value="Personal">Personal</option>
                                        <option value="Team">Team</option>
                                        <option value="Company">Company</option>
                                    </select>
                                </div>
                                <div class="okr-form-field">
                                    <label>Start Date</label>
                                    <input type="date" id="okr-objective-start-date" required>
                                </div>
                            </div>
                            <div class="okr-form-column">
                                <div class="okr-form-field">
                                    <label>Year</label>
                                    <input type="number" id="okr-objective-year" min="2020" max="2100" required>
                                </div>
                                <div class="okr-form-field">
                                    <label>Target Date</label>
                                    <input type="date" id="okr-objective-target-date" required>
                                </div>
                            </div>
                            <div class="okr-form-column">
                                <div class="okr-form-field">
                                    <label>Quarter</label>
                                    <select id="okr-objective-quarter" required>
                                        <option value="1">Q1</option>
                                        <option value="2">Q2</option>
                                        <option value="3">Q3</option>
                                        <option value="4">Q4</option>
                                    </select>
                                </div>
                                <div class="okr-form-field">
                                    <label>Weight (%)</label>
                                    <input type="number" id="okr-objective-weight" min="0" max="100" value="100" required>
                                </div>
                            </div>
                        </div>
                        <div class="okr-form-field">
                            <label>Objective</label>
                            <textarea id="okr-objective-title" placeholder="Enter your objective..." required rows="3"></textarea>
                        </div>
                        <div class="okr-form-field">
                            <label>Purpose</label>
                            <textarea id="okr-objective-purpose" placeholder="Why is this objective important?" rows="2"></textarea>
                        </div>
                        <div class="okr-form-field">
                            <label>Last Check-in</label>
                            <input type="date" id="okr-objective-last-checkin">
                        </div>
                        <button type="submit">Save Objective</button>
                    </form>
                </div>
            </div>

            <!-- Key Result Modal -->
            <div id="okr-kr-modal" class="okr-modal">
                <div class="okr-modal-content okr-modal-kr">
                    <span class="okr-close" data-modal="okr-kr-modal">&times;</span>
                    <h3 id="okr-kr-modal-title">Key Result</h3>
                    <form id="okr-kr-form">
                        <input type="hidden" id="okr-kr-edit-id">
                        <input type="hidden" id="okr-kr-objective-id">
                        <textarea id="okr-kr-title" placeholder="Key Result title..." required rows="3"></textarea>
                        <div class="okr-kr-target">
                            <label>Target Value:</label>
                            <input type="number" id="okr-kr-target" value="100" min="1" required>
                        </div>
                        <div class="okr-kr-target">
                            <label>Weight (%):</label>
                            <input type="number" id="okr-kr-weight" value="100" min="0" max="100" required>
                            <button type="button" id="okr-btn-balance-krs" class="okr-btn-small">Balance KRs</button>
                        </div>
                        <div class="okr-form-field">
                            <label>Status</label>
                            <select id="okr-kr-status">
                                <option value="on-track">On Track</option>
                                <option value="off-track">Off Track</option>
                                <option value="at-risk">At Risk</option>
                            </select>
                        </div>
                        <div class="okr-form-field">
                            <label>Confidence</label>
                            <select id="okr-kr-confidence">
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div class="okr-kr-dates">
                            <div class="okr-kr-date-field">
                                <label>Start Date:</label>
                                <input type="date" id="okr-kr-start-date" required>
                            </div>
                            <div class="okr-kr-date-field">
                                <label>Target Date:</label>
                                <input type="date" id="okr-kr-target-date" required>
                            </div>
                        </div>
                        <div class="okr-form-field">
                            <label>Last Check-in</label>
                            <input type="date" id="okr-kr-last-checkin">
                        </div>
                        <div class="okr-form-field">
                            <label>Evidence</label>
                            <textarea id="okr-kr-evidence" placeholder="Enter evidence or proof of progress..." rows="3"></textarea>
                        </div>
                        <div class="okr-form-field">
                            <label>Comments</label>
                            <textarea id="okr-kr-comments" placeholder="Enter any comments or notes..." rows="3"></textarea>
                        </div>
                        <button type="submit" id="okr-kr-submit-btn">Add Key Result</button>
                    </form>
                </div>
            </div>

            <!-- Modal for Progress Trends -->
            <div id="okr-progress-trends-modal" class="okr-modal">
                <div class="okr-modal-content okr-modal-wide okr-modal-history">
                    <span class="okr-close" data-modal="okr-progress-trends-modal">&times;</span>
                    <h3>📈 Progress Trends & Analysis</h3>
                    <div id="okr-progress-trends-content">
                        <div class="okr-history-filters">
                            <label>
                                <input type="radio" name="okr-trends-view" value="grouped" id="okr-trends-view-grouped" checked>
                                <span>Grouped by Category</span>
                            </label>
                            <label>
                                <input type="radio" name="okr-trends-view" value="individual" id="okr-trends-view-individual">
                                <span>Individual Objectives</span>
                            </label>
                        </div>
                        <div class="okr-history-filters" id="okr-trends-individual-filters" style="display: none;">
                            <select id="okr-trends-filter-group">
                                <option value="all">All Groups</option>
                                <option value="Personal">Personal</option>
                                <option value="Team">Team</option>
                                <option value="Company">Company</option>
                            </select>
                            <select id="okr-trends-filter-objective">
                                <option value="all">All Objectives</option>
                            </select>
                        </div>
                        <div id="okr-progress-trends-charts" class="okr-progress-trends-charts"></div>
                    </div>
                </div>
            </div>

            <!-- Modal for History -->
            <div id="okr-history-modal" class="okr-modal">
                <div class="okr-modal-content okr-modal-wide okr-modal-history">
                    <span class="okr-close" data-modal="okr-history-modal">&times;</span>
                    <h3>📊 Change History & Trends</h3>
                    <div id="okr-history-content">
                        <div class="okr-history-filters">
                            <select id="okr-history-filter-type">
                                <option value="all">All Changes</option>
                                <option value="objective">Objectives Only</option>
                                <option value="keyresult">Key Results Only</option>
                            </select>
                            <select id="okr-history-filter-group">
                                <option value="all">All Groups</option>
                                <option value="Personal">Personal</option>
                                <option value="Team">Team</option>
                                <option value="Company">Company</option>
                            </select>
                        </div>
                        <div id="okr-history-list" class="okr-history-list"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Menu bar buttons are already set up in registerMenuButton()
        // Just ensure they're visible

        // Objective form
        const objForm = document.getElementById('okr-objective-form');
        if (objForm) {
            objForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveObjective();
            });
        }

        // KR form
        const krForm = document.getElementById('okr-kr-form');
        if (krForm) {
            krForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveKeyResult();
            });
        }

        // Balance KRs button
        const balanceKRsBtn = document.getElementById('okr-btn-balance-krs');
        if (balanceKRsBtn) {
            balanceKRsBtn.addEventListener('click', () => {
                const objectiveId = document.getElementById('okr-kr-objective-id').value;
                if (objectiveId) {
                    this.balanceKRWeights(objectiveId);
                }
            });
        }

        // Close modals
        document.querySelectorAll('.okr-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                document.getElementById(modalId).classList.remove('active');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.okr-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.okr-modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        // Set up history filters
        this.setupHistoryFilters();

        // Fix calendar picker visibility for date inputs
        this.setupDateInputHandlers();
        
        // Also set up handlers when modals are opened
        this.setupModalOpenHandlers();
    }

    /**
     * Setup handlers for when modals are opened to ensure date inputs work
     */
    setupModalOpenHandlers() {
        // Watch for modal activation
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    const mainWindow = document.querySelector('.main-window-section');
                    const body = document.body;
                    
                    if (target.classList.contains('okr-modal')) {
                        if (target.classList.contains('active')) {
                            // Modal just opened - allow horizontal overflow for calendar picker
                            if (mainWindow) {
                                mainWindow.classList.add('okr-modal-active');
                                // Store original and set overflow-x to visible
                                if (!mainWindow.dataset.originalOverflowX) {
                                    const computed = window.getComputedStyle(mainWindow);
                                    mainWindow.dataset.originalOverflowX = computed.overflowX || 'hidden';
                                }
                                mainWindow.style.overflowX = 'visible';
                            }
                            if (body) {
                                body.classList.add('okr-modal-active');
                            }
                            // Ensure date inputs are properly set up
                            setTimeout(() => {
                                this.setupDateInputHandlers();
                            }, 100);
                        } else {
                            // Modal just closed - restore original overflow
                            if (mainWindow) {
                                mainWindow.classList.remove('okr-modal-active');
                                if (mainWindow.dataset.originalOverflowX !== undefined) {
                                    mainWindow.style.overflowX = mainWindow.dataset.originalOverflowX || 'hidden';
                                }
                            }
                            if (body) {
                                body.classList.remove('okr-modal-active');
                            }
                        }
                    }
                }
            });
        });

        // Observe all modals
        document.querySelectorAll('.okr-modal').forEach(modal => {
            observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        });
        
        // Also observe dynamically added modals
        const modalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('okr-modal')) {
                        observer.observe(node, { attributes: true, attributeFilter: ['class'] });
                    }
                });
            });
        });
        
        const container = document.getElementById('modules-container');
        if (container) {
            modalObserver.observe(container, { childList: true, subtree: true });
        }
    }

    /**
     * Setup handlers for date inputs to allow calendar picker to be visible
     */
    setupDateInputHandlers() {
        // Use event delegation to handle dynamically added date inputs
        document.addEventListener('click', (e) => {
            // Check if clicking on date input or its calendar icon
            const dateInput = e.target.closest('input[type="date"]');
            if (dateInput && dateInput.closest('.okr-modal-content')) {
                const modalContent = dateInput.closest('.okr-modal-content');
                const mainWindow = document.querySelector('.main-window-section');
                
                if (modalContent) {
                    // Store original overflow if not already stored
                    if (!modalContent.dataset.originalOverflowY) {
                        modalContent.dataset.originalOverflowY = window.getComputedStyle(modalContent).overflowY || 'auto';
                    }
                    // Only change overflow-x to visible, keep overflow-y for scrolling
                    modalContent.style.overflowX = 'visible';
                }
                
                // Also fix main window overflow-x only (keep overflow-y for scrolling)
                if (mainWindow && !mainWindow.dataset.originalOverflowX) {
                    const computedStyle = window.getComputedStyle(mainWindow);
                    mainWindow.dataset.originalOverflowX = computedStyle.overflowX || 'hidden';
                    mainWindow.dataset.originalOverflowY = computedStyle.overflowY || 'auto';
                    mainWindow.style.overflowX = 'visible';
                    // Keep overflow-y as auto for scrolling
                }
                
                // Try to programmatically show the picker if it's not showing
                setTimeout(() => {
                    if (dateInput.showPicker && typeof dateInput.showPicker === 'function') {
                        try {
                            dateInput.showPicker();
                        } catch (err) {
                            // showPicker might not be available or might require user gesture
                            console.log('showPicker not available:', err);
                        }
                    }
                }, 10);
            }
        }, true); // Use capture phase

        document.addEventListener('focus', (e) => {
            if (e.target.matches('.okr-modal-content input[type="date"]')) {
                const modalContent = e.target.closest('.okr-modal-content');
                const mainWindow = document.querySelector('.main-window-section');
                
                if (modalContent) {
                    // Store original overflow if not already stored
                    if (!modalContent.dataset.originalOverflowY) {
                        modalContent.dataset.originalOverflowY = window.getComputedStyle(modalContent).overflowY || 'auto';
                    }
                    // Only change overflow-x to visible, keep overflow-y for scrolling
                    modalContent.style.overflowX = 'visible';
                }
                
                // Also fix main window overflow-x only (keep overflow-y for scrolling)
                if (mainWindow && !mainWindow.dataset.originalOverflowX) {
                    const computedStyle = window.getComputedStyle(mainWindow);
                    mainWindow.dataset.originalOverflowX = computedStyle.overflowX || 'hidden';
                    mainWindow.dataset.originalOverflowY = computedStyle.overflowY || 'auto';
                    mainWindow.style.overflowX = 'visible';
                }
            }
        }, true); // Use capture phase

        document.addEventListener('blur', (e) => {
            if (e.target.matches('.okr-modal-content input[type="date"]')) {
                const modalContent = e.target.closest('.okr-modal-content');
                const mainWindow = document.querySelector('.main-window-section');
                
                if (modalContent && modalContent.dataset.originalOverflowY !== undefined) {
                    // Use setTimeout to allow calendar picker to close first
                    setTimeout(() => {
                        modalContent.style.overflowX = 'visible'; // Keep visible for calendar
                        modalContent.style.overflowY = modalContent.dataset.originalOverflowY || 'auto';
                    }, 300);
                }
                
                // Restore main window overflow-x only
                if (mainWindow && mainWindow.dataset.originalOverflowX !== undefined) {
                    setTimeout(() => {
                        mainWindow.style.overflowX = mainWindow.dataset.originalOverflowX || 'hidden';
                        mainWindow.style.overflowY = mainWindow.dataset.originalOverflowY || 'auto';
                    }, 300);
                }
            }
        }, true); // Use capture phase
    }

    /**
     * Calculate objective progress
     */
    calculateProgress(objective) {
        if (!objective.keyResults || objective.keyResults.length === 0) {
            return 0;
        }
        const total = objective.keyResults.reduce((sum, kr) => {
            return sum + (kr.current / kr.target) * 100;
        }, 0);
        return Math.min(100, Math.round(total / objective.keyResults.length));
    }

    /**
     * Update dashboard charts
     */
    updateDashboardCharts() {
        const groups = ['Personal', 'Team', 'Company'];
        const circumference = 2 * Math.PI * 52; // 326.73
        
        groups.forEach(group => {
            const groupLower = group.toLowerCase();
            const objectives = this.data.objectives.filter(obj => (obj.group || 'Personal') === group);
            const count = objectives.length;
            
            let totalProgress = 0;
            if (count > 0) {
                objectives.forEach(obj => {
                    totalProgress += this.calculateProgress(obj);
                });
            }
            const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;
            
            const countEl = document.getElementById(`okr-${groupLower}-count`);
            const percentEl = document.getElementById(`okr-${groupLower}-percent`);
            const ring = document.querySelector(`.okr-ring-${groupLower}`);
            
            if (countEl) countEl.textContent = count;
            if (percentEl) percentEl.textContent = `${avgProgress}%`;
            if (ring) {
                const offset = circumference - (avgProgress / 100) * circumference;
                ring.style.strokeDashoffset = offset;
            }
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date to show only date part (YYYY-MM-DD)
     */
    formatDateOnly(dateString) {
        if (!dateString) return '';
        // If it's already in YYYY-MM-DD format, return as is
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        // If it's an ISO string with time, extract just the date part
        if (dateString.includes('T')) {
            return dateString.split('T')[0];
        }
        return dateString;
    }

    /**
     * Get progress bar color based on percentage
     * 0-25%: blue, 26-55%: yellowish, 56-69%: light green, 70-100%: dark green
     */
    getProgressColor(percentage) {
        if (percentage <= 25) {
            return '#3b82f6'; // blue
        } else if (percentage <= 55) {
            return '#eab308'; // yellowish
        } else if (percentage <= 69) {
            return '#10b981'; // light green
        } else {
            return '#059669'; // dark green
        }
    }

    /**
     * Get status label from status value
     */
    getStatusLabel(status) {
        const labels = {
            'on-track': 'On Track',
            'off-track': 'Off Track',
            'at-risk': 'At Risk'
        };
        return labels[status] || 'On Track';
    }

    /**
     * Add history entry
     */
    addHistoryEntry(type, itemType, itemId, itemTitle, changes, group = null) {
        if (!this.data.history) {
            this.data.history = [];
        }
        
        const entry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: type, // 'created', 'updated', 'progress', 'status', 'deleted'
            itemType: itemType, // 'objective' or 'keyresult'
            itemId: itemId,
            itemTitle: itemTitle,
            changes: changes, // Object describing what changed
            group: group
        };
        
        this.data.history.unshift(entry); // Add to beginning
        
        // Keep only last 1000 history entries to prevent file bloat
        if (this.data.history.length > 1000) {
            this.data.history = this.data.history.slice(0, 1000);
        }
    }

    /**
     * Record progress snapshot for trend tracking
     */
    recordProgressSnapshot() {
        if (!this.data.objectives || this.data.objectives.length === 0) return;
        
        const timestamp = new Date().toISOString();
        const snapshot = {
            timestamp: timestamp,
            objectives: {}
        };
        
        this.data.objectives.forEach(obj => {
            const progress = this.calculateProgress(obj);
            snapshot.objectives[obj.id] = {
                title: obj.title,
                group: obj.group || 'Personal',
                progress: progress,
                keyResults: {}
            };
            
            if (obj.keyResults) {
                obj.keyResults.forEach(kr => {
                    const krProgress = Math.min(100, Math.round((kr.current / kr.target) * 100));
                    snapshot.objectives[obj.id].keyResults[kr.id] = {
                        title: kr.title,
                        progress: krProgress,
                        current: kr.current,
                        target: kr.target
                    };
                });
            }
        });
        
        // Store in history as progress snapshot
        if (!this.data.history) {
            this.data.history = [];
        }
        
        // Always create a new snapshot entry to track progress changes over time
        this.addHistoryEntry('progress-snapshot', 'system', 'all', 'Progress Snapshot', { snapshot: snapshot }, null);
    }

    /**
     * Render objectives
     */
    renderObjectives() {
        const container = document.getElementById('okr-objectives-container');
        if (!container) return;
        
        if (this.data.objectives.length === 0) {
            container.innerHTML = `
                <div class="okr-empty-state">
                    <span>🎯</span>
                    <p>No objectives yet. Add your first objective above!</p>
                </div>
            `;
            this.updateDashboardCharts();
            return;
        }
        
        this.updateDashboardCharts();
        
        container.innerHTML = this.data.objectives.map(obj => {
            const progress = this.calculateProgress(obj);
            return `
                <div class="okr-objective-card" data-id="${obj.id}">
                    <div class="okr-objective-header">
                        <div class="okr-objective-info">
                            <div class="okr-objective-meta">
                                <span class="okr-obj-badge okr-obj-group-${(obj.group || 'Personal').toLowerCase()}">${obj.group || 'Personal'}</span>
                                <span class="okr-obj-badge">${obj.year || ''} Q${obj.quarter || ''}</span>
                                <span class="okr-obj-badge">${obj.weight || 100}%</span>
                                ${(obj.created || obj.createdAt) ? `<span class="okr-obj-badge">Created: ${this.formatDateOnly(obj.created || obj.createdAt)}</span>` : ''}
                                ${obj.startDate ? `<span class="okr-obj-badge">Start: ${obj.startDate}</span>` : ''}
                                ${obj.targetDate ? `<span class="okr-obj-badge">Due: ${obj.targetDate}</span>` : ''}
                                ${obj.lastCheckin ? `<span class="okr-obj-badge">Last Check-in: ${obj.lastCheckin}</span>` : ''}
                            </div>
                            <div class="okr-objective-content-box">
                                <label class="okr-box-label">Objective</label>
                                <h3 class="okr-objective-title">${this.escapeHtml(obj.title)}</h3>
                            </div>
                            ${obj.purpose ? `<div class="okr-objective-content-box"><label class="okr-box-label">Purpose</label><p class="okr-objective-purpose">${this.escapeHtml(obj.purpose)}</p></div>` : ''}
                        </div>
                        <div class="okr-objective-actions">
                            <button class="okr-btn-icon okr-btn-add-kr" onclick="window.okrTracker.openKRModal('${obj.id}')" title="Add Key Result">+</button>
                            <button class="okr-btn-icon" onclick="window.okrTracker.openObjectiveModal('${obj.id}')" title="Edit">✎</button>
                            <button class="okr-btn-icon okr-btn-delete" onclick="window.okrTracker.deleteObjective('${obj.id}')" title="Delete">🗑</button>
                        </div>
                    </div>
                    <div class="okr-objective-progress">
                        <div class="okr-progress-bar">
                            <div class="okr-progress-fill" style="width: ${progress}%; background: ${this.getProgressColor(progress)}"></div>
                        </div>
                        <div class="okr-progress-text">
                            <span>${obj.keyResults?.length || 0} Key Results</span>
                            <span>${progress}% Complete</span>
                        </div>
                    </div>
                    ${obj.keyResults && obj.keyResults.length > 0 ? `
                        <div class="okr-key-results">
                            <h4>Key Results</h4>
                            <div class="okr-kr-list">
                                ${obj.keyResults.map(kr => {
                                    const krProgress = Math.min(100, Math.round((kr.current / kr.target) * 100));
                                    return `
                                        <div class="okr-kr-item okr-kr-border-${kr.status || 'on-track'}" data-kr-id="${kr.id}">
                                            <div class="okr-kr-info">
                                                <div class="okr-kr-title-row">
                                                    <div class="okr-kr-title">${this.escapeHtml(kr.title)}</div>
                                                </div>
                                                <div class="okr-kr-meta-row">
                                                    <span class="okr-kr-meta-item okr-kr-status-badge okr-kr-status-${kr.status || 'on-track'}">${this.getStatusLabel(kr.status || 'on-track')}</span>
                                                    <span class="okr-kr-meta-item okr-kr-confidence-badge okr-kr-confidence-${(kr.confidence || 'Medium').toLowerCase()}">Confidence: ${kr.confidence || 'Medium'}</span>
                                                    <span class="okr-kr-meta-item okr-kr-weight-badge">Weight: ${kr.weight || 100}%</span>
                                                    ${(kr.created || kr.createdAt) ? `<span class="okr-kr-meta-item">Created: ${this.formatDateOnly(kr.created || kr.createdAt)}</span>` : ''}
                                                    ${kr.startDate ? `<span class="okr-kr-meta-item">Start: ${kr.startDate}</span>` : ''}
                                                    ${kr.targetDate ? `<span class="okr-kr-meta-item">Target: ${kr.targetDate}</span>` : ''}
                                                    ${kr.lastCheckin ? `<span class="okr-kr-meta-item">Last Check-in: ${kr.lastCheckin}</span>` : ''}
                                                </div>
                                                ${kr.evidence ? `<div class="okr-kr-evidence-section"><label class="okr-kr-section-label">Evidence:</label><div class="okr-kr-evidence-content">${this.escapeHtml(kr.evidence)}</div></div>` : ''}
                                                ${kr.comments ? `<div class="okr-kr-comments-section"><label class="okr-kr-section-label">Comments:</label><div class="okr-kr-comments-content">${this.escapeHtml(kr.comments)}</div></div>` : ''}
                                                <div class="okr-kr-progress-row">
                                                    <div class="okr-kr-progress-bar">
                                                        <div class="okr-kr-progress-fill" style="width: ${krProgress}%"></div>
                                                    </div>
                                                    <span class="okr-kr-value">${kr.current} / ${kr.target}</span>
                                                </div>
                                            </div>
                                            <div class="okr-kr-controls">
                                                <button onclick="window.okrTracker.updateKR('${obj.id}', '${kr.id}', -10)" title="Decrease">−</button>
                                                <button onclick="window.okrTracker.updateKR('${obj.id}', '${kr.id}', 10)" title="Increase">+</button>
                                                <button onclick="window.okrTracker.openKRModal('${obj.id}', '${kr.id}')" title="Edit">✎</button>
                                                <button class="okr-btn-delete-kr" onclick="window.okrTracker.deleteKR('${obj.id}', '${kr.id}')" title="Delete">×</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Open objective modal
     */
    openObjectiveModal(objectiveId = null) {
        const form = document.getElementById('okr-objective-form');
        if (!form) return;
        
        form.reset();
        document.getElementById('okr-objective-edit-id').value = objectiveId || '';
        
        if (objectiveId) {
            const obj = this.data.objectives.find(o => o.id === objectiveId);
            if (obj) {
                document.getElementById('okr-objective-modal-title').textContent = 'Objective';
                document.getElementById('okr-objective-group').value = obj.group || 'Personal';
                document.getElementById('okr-objective-year').value = obj.year || new Date().getFullYear();
                document.getElementById('okr-objective-quarter').value = obj.quarter || '1';
                document.getElementById('okr-objective-title').value = obj.title;
                document.getElementById('okr-objective-purpose').value = obj.purpose || '';
                document.getElementById('okr-objective-start-date').value = obj.startDate || '';
                document.getElementById('okr-objective-target-date').value = obj.targetDate || '';
                document.getElementById('okr-objective-weight').value = obj.weight || 100;
                document.getElementById('okr-objective-last-checkin').value = obj.lastCheckin || '';
            }
        } else {
            document.getElementById('okr-objective-modal-title').textContent = 'Add Objective';
            document.getElementById('okr-objective-year').value = new Date().getFullYear();
            const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
            document.getElementById('okr-objective-quarter').value = currentQuarter;
            document.getElementById('okr-objective-start-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('okr-objective-last-checkin').value = '';
        }
        
        document.getElementById('okr-objective-modal').classList.add('active');
        document.getElementById('okr-objective-title').focus();
    }

    /**
     * Auto-balance objective weights (called when adding new objectives)
     */
    autoBalanceObjectiveWeights() {
        if (this.data.objectives.length === 0) return;
        const equalWeight = Math.floor(100 / this.data.objectives.length);
        const remainder = 100 - (equalWeight * this.data.objectives.length);
        
        this.data.objectives.forEach((obj, index) => {
            obj.weight = equalWeight + (index < remainder ? 1 : 0);
        });
    }

    /**
     * Balance other objectives after one is manually set
     */
    balanceOtherObjectives(editedId, manualWeight) {
        if (this.data.objectives.length <= 1) return;
        
        const remainingWeight = 100 - manualWeight;
        const others = this.data.objectives.filter(o => o.id !== editedId);
        
        if (others.length === 0) return;
        
        const equalWeight = Math.floor(remainingWeight / others.length);
        const remainder = remainingWeight - (equalWeight * others.length);
        
        others.forEach((obj, index) => {
            obj.weight = equalWeight + (index < remainder ? 1 : 0);
        });
    }

    /**
     * Auto-balance KR weights (called when adding new key results)
     */
    autoBalanceKRWeights(objectiveId) {
        const obj = this.data.objectives.find(o => o.id === objectiveId);
        if (!obj || !obj.keyResults || obj.keyResults.length === 0) return;
        
        const equalWeight = Math.floor(100 / obj.keyResults.length);
        const remainder = 100 - (equalWeight * obj.keyResults.length);
        
        obj.keyResults.forEach((kr, index) => {
            kr.weight = equalWeight + (index < remainder ? 1 : 0);
        });
    }

    /**
     * Balance other KRs after one is manually set
     */
    balanceOtherKRs(objectiveId, editedKRId, manualWeight) {
        const obj = this.data.objectives.find(o => o.id === objectiveId);
        if (!obj || !obj.keyResults || obj.keyResults.length <= 1) return;
        
        const remainingWeight = 100 - manualWeight;
        const others = obj.keyResults.filter(kr => kr.id !== editedKRId);
        
        if (others.length === 0) return;
        
        const equalWeight = Math.floor(remainingWeight / others.length);
        const remainder = remainingWeight - (equalWeight * others.length);
        
        others.forEach((kr, index) => {
            kr.weight = equalWeight + (index < remainder ? 1 : 0);
        });
    }

    /**
     * Balance key result weights for a specific objective (manual trigger)
     */
    async balanceKRWeights(objectiveId) {
        this.autoBalanceKRWeights(objectiveId);
        await this.saveData();
        this.renderObjectives();
        // Update the weight input in the modal if it's open
        const weightInput = document.getElementById('okr-kr-weight');
        if (weightInput) {
            const objective = this.data.objectives.find(o => o.id === objectiveId);
            if (objective && objective.keyResults && objective.keyResults.length > 0) {
                // Find the KR being edited or use the first one
                const editId = document.getElementById('okr-kr-edit-id').value;
                const kr = editId 
                    ? objective.keyResults.find(k => k.id === editId)
                    : objective.keyResults[0];
                if (kr) {
                    weightInput.value = kr.weight;
                }
            }
        }
    }

    /**
     * Save objective
     */
    async saveObjective() {
        const editId = document.getElementById('okr-objective-edit-id').value;
        const formData = {
            group: document.getElementById('okr-objective-group').value,
            year: parseInt(document.getElementById('okr-objective-year').value),
            quarter: document.getElementById('okr-objective-quarter').value,
            title: document.getElementById('okr-objective-title').value.trim(),
            purpose: document.getElementById('okr-objective-purpose').value.trim(),
            startDate: document.getElementById('okr-objective-start-date').value,
            targetDate: document.getElementById('okr-objective-target-date').value,
            weight: parseInt(document.getElementById('okr-objective-weight').value),
            lastCheckin: document.getElementById('okr-objective-last-checkin').value
        };
        
        if (!formData.title) return;
        
        if (editId) {
            // Update existing objective
            const obj = this.data.objectives.find(o => o.id === editId);
            if (obj) {
                const oldWeight = obj.weight;
                const changes = {};
                
                // Track all possible changes
                if (obj.title !== formData.title) changes.title = { from: obj.title, to: formData.title };
                if (obj.group !== formData.group) changes.group = { from: obj.group, to: formData.group };
                if (obj.year !== formData.year) changes.year = { from: obj.year, to: formData.year };
                if (obj.quarter !== formData.quarter) changes.quarter = { from: obj.quarter, to: formData.quarter };
                if (obj.purpose !== formData.purpose) changes.purpose = { from: obj.purpose || '', to: formData.purpose || '' };
                if (obj.startDate !== formData.startDate) changes.startDate = { from: obj.startDate || '', to: formData.startDate || '' };
                if (obj.targetDate !== formData.targetDate) changes.targetDate = { from: obj.targetDate || '', to: formData.targetDate || '' };
                if (obj.weight !== formData.weight) changes.weight = { from: obj.weight, to: formData.weight };
                if (obj.lastCheckin !== formData.lastCheckin) changes.lastCheckin = { from: obj.lastCheckin || '', to: formData.lastCheckin || '' };
                
                Object.assign(obj, formData);
                
                // Track changes in history (record if any field changed)
                if (Object.keys(changes).length > 0) {
                    this.addHistoryEntry('updated', 'objective', editId, formData.title, changes, formData.group);
                }
                
                // If weight changed, balance other objectives
                if (oldWeight !== formData.weight) {
                    this.balanceOtherObjectives(editId, formData.weight);
                }
            }
        } else {
            // Add new objective
            const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const newId = this.generateId();
            this.data.objectives.push({
                id: newId,
                ...formData,
                weight: 0, // Will be balanced
                keyResults: [],
                created: today
            });
            // Auto-balance all objective weights
            this.autoBalanceObjectiveWeights();
            // Track creation in history
            this.addHistoryEntry('created', 'objective', newId, formData.title, { created: true }, formData.group);
        }
        
        this.recordProgressSnapshot(); // Record snapshot before saving
        await this.saveData();
        this.renderObjectives();
        document.getElementById('okr-objective-modal').classList.remove('active');
    }

    /**
     * Delete objective
     */
    async deleteObjective(id) {
        if (!confirm('Delete this objective and all its key results?')) return;
        const obj = this.data.objectives.find(o => o.id === id);
        if (obj) {
            this.addHistoryEntry('deleted', 'objective', id, obj.title, { deleted: true }, obj.group);
        }
        this.data.objectives = this.data.objectives.filter(obj => obj.id !== id);
        // Re-balance weights after deletion
        this.autoBalanceObjectiveWeights();
        this.recordProgressSnapshot(); // Record snapshot before saving
        await this.saveData();
        this.renderObjectives();
    }

    /**
     * Open KR modal
     */
    openKRModal(objectiveId, krId = null) {
        document.getElementById('okr-kr-objective-id').value = objectiveId;
        document.getElementById('okr-kr-edit-id').value = krId || '';
        
        const submitBtn = document.getElementById('okr-kr-submit-btn');
        
        if (krId) {
            const objective = this.data.objectives.find(obj => obj.id === objectiveId);
            const kr = objective?.keyResults?.find(k => k.id === krId);
            if (kr) {
                document.getElementById('okr-kr-modal-title').textContent = 'Key Result';
                if (submitBtn) submitBtn.textContent = 'Save Key Result';
                document.getElementById('okr-kr-title').value = kr.title;
                document.getElementById('okr-kr-target').value = kr.target;
                document.getElementById('okr-kr-start-date').value = kr.startDate || '';
                document.getElementById('okr-kr-target-date').value = kr.targetDate || '';
                document.getElementById('okr-kr-weight').value = kr.weight || 100;
                document.getElementById('okr-kr-status').value = kr.status || 'on-track';
                document.getElementById('okr-kr-confidence').value = kr.confidence || 'Medium';
                document.getElementById('okr-kr-last-checkin').value = kr.lastCheckin || '';
                document.getElementById('okr-kr-evidence').value = kr.evidence || '';
                document.getElementById('okr-kr-comments').value = kr.comments || '';
            }
        } else {
            document.getElementById('okr-kr-modal-title').textContent = 'Add Key Result';
            if (submitBtn) submitBtn.textContent = 'Add Key Result';
            document.getElementById('okr-kr-title').value = '';
            document.getElementById('okr-kr-target').value = '100';
            document.getElementById('okr-kr-start-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('okr-kr-target-date').value = '';
            document.getElementById('okr-kr-weight').value = '100';
            document.getElementById('okr-kr-status').value = 'on-track';
            document.getElementById('okr-kr-confidence').value = 'Medium';
            document.getElementById('okr-kr-last-checkin').value = '';
            document.getElementById('okr-kr-evidence').value = '';
            document.getElementById('okr-kr-comments').value = '';
        }
        
        document.getElementById('okr-kr-modal').classList.add('active');
        document.getElementById('okr-kr-title').focus();
    }

    /**
     * Save key result
     */
    async saveKeyResult() {
        const objectiveId = document.getElementById('okr-kr-objective-id').value;
        const editId = document.getElementById('okr-kr-edit-id').value;
        const title = document.getElementById('okr-kr-title').value.trim();
        const target = parseInt(document.getElementById('okr-kr-target').value);
        const startDate = document.getElementById('okr-kr-start-date').value;
        const targetDate = document.getElementById('okr-kr-target-date').value;
        const weight = parseInt(document.getElementById('okr-kr-weight').value);
        const status = document.getElementById('okr-kr-status').value;
        const confidence = document.getElementById('okr-kr-confidence').value;
        const lastCheckin = document.getElementById('okr-kr-last-checkin').value;
        const evidence = document.getElementById('okr-kr-evidence').value.trim();
        const comments = document.getElementById('okr-kr-comments').value.trim();
        
        if (!title || !target || !startDate || !targetDate) {
            alert('Please fill in all required fields');
            return;
        }
        
        const objective = this.data.objectives.find(obj => obj.id === objectiveId);
        if (!objective) {
            alert('Objective not found');
            return;
        }
        
        if (!objective.keyResults) objective.keyResults = [];
        
        if (editId) {
            // Update existing key result
            const kr = objective.keyResults.find(k => k.id === editId);
            if (kr) {
                const oldWeight = kr.weight;
                kr.title = title;
                kr.target = target;
                kr.current = Math.min(kr.current, target);
                kr.startDate = startDate;
                kr.targetDate = targetDate;
                kr.weight = weight;
                kr.status = status;
                kr.confidence = confidence;
                kr.lastCheckin = lastCheckin;
                kr.evidence = evidence;
                kr.comments = comments;
                
                // Track changes in history (before updating)
                const changes = {};
                if (kr.title !== title) changes.title = { from: kr.title, to: title };
                if (kr.status !== status) changes.status = { from: kr.status, to: status };
                if ((kr.confidence || 'Medium') !== confidence) changes.confidence = { from: kr.confidence || 'Medium', to: confidence };
                if (kr.target !== target) changes.target = { from: kr.target, to: target };
                if ((kr.startDate || '') !== startDate) changes.startDate = { from: kr.startDate || '', to: startDate || '' };
                if ((kr.targetDate || '') !== targetDate) changes.targetDate = { from: kr.targetDate || '', to: targetDate || '' };
                if (kr.weight !== weight) changes.weight = { from: kr.weight, to: weight };
                if ((kr.lastCheckin || '') !== lastCheckin) changes.lastCheckin = { from: kr.lastCheckin || '', to: lastCheckin || '' };
                if ((kr.evidence || '') !== evidence) changes.evidence = { from: kr.evidence || '', to: evidence || '' };
                if ((kr.comments || '') !== comments) changes.comments = { from: kr.comments || '', to: comments || '' };
                
                if (Object.keys(changes).length > 0) {
                    this.addHistoryEntry('updated', 'keyresult', editId, title, changes, objective.group);
                }
                
                // If weight changed, balance other KRs
                if (oldWeight !== weight) {
                    this.balanceOtherKRs(objectiveId, editId, weight);
                }
            } else {
                alert('Key Result not found');
                return;
            }
        } else {
            // Add new key result
            const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
            const newKrId = this.generateId();
            objective.keyResults.push({
                id: newKrId,
                title: title,
                target: target,
                current: 0,
                startDate: startDate,
                targetDate: targetDate,
                weight: 0, // Will be balanced
                status: status,
                confidence: confidence,
                lastCheckin: lastCheckin,
                evidence: evidence,
                comments: comments,
                created: today
            });
            // Auto-balance all KR weights for this objective
            this.autoBalanceKRWeights(objectiveId);
            // Track creation in history
            this.addHistoryEntry('created', 'keyresult', newKrId, title, { created: true }, objective.group);
        }
        
        this.recordProgressSnapshot(); // Record snapshot before saving
        await this.saveData();
        this.renderObjectives();
        document.getElementById('okr-kr-modal').classList.remove('active');
    }

    /**
     * Update KR progress
     */
    async updateKR(objectiveId, krId, delta) {
        const objective = this.data.objectives.find(obj => obj.id === objectiveId);
        if (objective) {
            const kr = objective.keyResults.find(k => k.id === krId);
            if (kr) {
                const oldCurrent = kr.current;
                const oldProgress = Math.min(100, Math.round((oldCurrent / kr.target) * 100));
                kr.current = Math.max(0, Math.min(kr.target, kr.current + delta));
                const newProgress = Math.min(100, Math.round((kr.current / kr.target) * 100));
                
                // Track progress change in history
                if (oldCurrent !== kr.current) {
                    this.addHistoryEntry('progress', 'keyresult', krId, kr.title, {
                        progress: {
                            from: `${oldCurrent}/${kr.target} (${oldProgress}%)`,
                            to: `${kr.current}/${kr.target} (${newProgress}%)`,
                            delta: delta
                        }
                    }, objective.group);
                }
                
                this.recordProgressSnapshot(); // Record snapshot before saving
                await this.saveData();
                this.renderObjectives();
            }
        }
    }

    /**
     * Delete key result
     */
    async deleteKR(objectiveId, krId) {
        const objective = this.data.objectives.find(obj => obj.id === objectiveId);
        if (objective) {
            const kr = objective.keyResults.find(k => k.id === krId);
            if (kr) {
                this.addHistoryEntry('deleted', 'keyresult', krId, kr.title, { deleted: true }, objective.group);
            }
            objective.keyResults = objective.keyResults.filter(k => k.id !== krId);
            // Re-balance KR weights after deletion
            this.autoBalanceKRWeights(objectiveId);
            this.recordProgressSnapshot(); // Record snapshot before saving
            await this.saveData();
            this.renderObjectives();
        }
    }

    /**
     * Export to text
     */
    exportToText() {
        if (!this.data.objectives || this.data.objectives.length === 0) {
            alert('No objectives to export');
            return;
        }
        
        let text = '═'.repeat(60) + '\n';
        text += '                    OKR REPORT\n';
        text += '                 ' + new Date().toLocaleDateString() + '\n';
        text += '═'.repeat(60) + '\n\n';
        
        const groups = ['Personal', 'Team', 'Company'];
        groups.forEach(group => {
            const objectives = this.data.objectives.filter(obj => (obj.group || 'Personal') === group);
            const count = objectives.length;
            let totalProgress = 0;
            if (count > 0) {
                objectives.forEach(obj => {
                    totalProgress += this.calculateProgress(obj);
                });
            }
            const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;
            text += `  ${group.padEnd(12)} ${count} objective(s)    ${avgProgress}% complete\n`;
        });
        text += '\n' + '═'.repeat(60) + '\n\n';
        
        this.data.objectives.forEach((obj, index) => {
            const progress = this.calculateProgress(obj);
            text += `OBJECTIVE ${index + 1}\n`;
            text += '─'.repeat(40) + '\n';
            text += `     ${'Group:'.padEnd(15)} ${obj.group || 'Personal'}\n`;
            text += `     ${'Period:'.padEnd(15)} ${obj.year || ''} Q${obj.quarter || ''}\n`;
            text += `     ${'Weight:'.padEnd(15)} ${obj.weight || 100}%\n`;
            const createdDate = obj.created || obj.createdAt;
            text += `     ${'Created:'.padEnd(15)} ${createdDate ? this.formatDateOnly(createdDate) : 'N/A'}\n`;
            text += `     ${'Start Date:'.padEnd(15)} ${obj.startDate || 'N/A'}\n`;
            text += `     ${'Due Date:'.padEnd(15)} ${obj.targetDate || 'N/A'}\n`;
            text += `     ${'Last Check-in:'.padEnd(15)} ${obj.lastCheckin || 'N/A'}\n`;
            text += `     ${'Progress:'.padEnd(15)} ${progress}%\n\n`;
            text += `Title:\n${obj.title}\n`;
            if (obj.purpose) {
                text += `\nPurpose:\n${obj.purpose}\n`;
            }
            
            if (obj.keyResults && obj.keyResults.length > 0) {
                text += '\nKey Results:\n';
                obj.keyResults.forEach((kr, krIndex) => {
                    const krProgress = Math.min(100, Math.round((kr.current / kr.target) * 100));
                    text += `\n  ${krIndex + 1}. ${kr.title}\n`;
                    text += `     ${'Progress:'.padEnd(15)} ${kr.current}/${kr.target} (${krProgress}%)\n`;
                    text += `     ${'Status:'.padEnd(15)} ${this.getStatusLabel(kr.status || 'on-track')}\n`;
                    text += `     ${'Confidence:'.padEnd(15)} ${kr.confidence || 'Medium'}\n`;
                    text += `     ${'Weight:'.padEnd(15)} ${kr.weight || 100}%\n`;
                    const krCreatedDate = kr.created || kr.createdAt;
                    text += `     ${'Created:'.padEnd(15)} ${krCreatedDate ? this.formatDateOnly(krCreatedDate) : 'N/A'}\n`;
                    if (kr.startDate && kr.targetDate) {
                        text += `     ${'Period:'.padEnd(15)} ${kr.startDate} >> ${kr.targetDate}\n`;
                    }
                    text += `     ${'Last Check-in:'.padEnd(15)} ${kr.lastCheckin || 'N/A'}\n`;
                    if (kr.evidence) {
                        text += `     Evidence:\n${kr.evidence.split('\n').map(line => `        ${line}`).join('\n')}\n`;
                    }
                    if (kr.comments) {
                        text += `     Comments:\n${kr.comments.split('\n').map(line => `        ${line}`).join('\n')}\n`;
                    }
                });
            }
            
            text += '\n' + '═'.repeat(60) + '\n\n';
        });
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OKR-Report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Open progress trends modal
     */
    openProgressTrendsModal() {
        this.setupProgressTrendsFilters();
        this.renderProgressTrends();
        document.getElementById('okr-progress-trends-modal').classList.add('active');
    }

    /**
     * Render progress trends visualization
     */
    renderProgressTrends() {
        const container = document.getElementById('okr-progress-trends-charts');
        if (!container) return;
        
        // Get progress snapshots from history
        const snapshots = (this.data.history || []).filter(h => h.type === 'progress-snapshot' && h.changes && h.changes.snapshot);
        
        if (snapshots.length === 0) {
            container.innerHTML = `
                <div class="okr-empty-state">
                    <span>📈</span>
                    <p>No progress history available yet. Progress will be tracked as you update your OKRs.</p>
                </div>
            `;
            return;
        }
        
        // Check which view mode is selected
        const viewMode = document.querySelector('input[name="okr-trends-view"]:checked')?.value || 'grouped';
        const individualFilters = document.getElementById('okr-trends-individual-filters');
        if (individualFilters) {
            individualFilters.style.display = viewMode === 'individual' ? 'flex' : 'none';
        }
        
        if (viewMode === 'grouped') {
            this.renderGroupedProgressTrends(container, snapshots);
        } else {
            this.renderIndividualProgressTrends(container, snapshots);
        }
    }

    /**
     * Render grouped progress trends (one chart for Personal, Team, Company)
     */
    renderGroupedProgressTrends(container, snapshots) {
        const groups = ['Personal', 'Team', 'Company'];
        const groupColors = {
            'Personal': '#10b981',
            'Team': '#eab308',
            'Company': '#3b82f6'
        };
        
        // Extract progress data by group
        const groupProgressData = {};
        groups.forEach(group => {
            groupProgressData[group] = [];
        });
        
        const existingObjectiveIds = new Set((this.data.objectives || []).map(obj => obj.id));
        const currentGroupsWithObjectives = new Set();
        (this.data.objectives || []).forEach(obj => {
            currentGroupsWithObjectives.add(obj.group || 'Personal');
        });
        
        snapshots.forEach(snapshot => {
            const date = new Date(snapshot.timestamp).toLocaleDateString();
            const snapshotData = snapshot.changes.snapshot;
            
            groups.forEach(group => {
                if (!currentGroupsWithObjectives.has(group)) return;
                
                let totalProgress = 0;
                let count = 0;
                
                Object.keys(snapshotData.objectives).forEach(objId => {
                    if (!existingObjectiveIds.has(objId)) return;
                    
                    const objData = snapshotData.objectives[objId];
                    if (objData.group === group) {
                        totalProgress += objData.progress;
                        count++;
                    }
                });
                
                if (count > 0) {
                    const avgProgress = Math.round(totalProgress / count);
                    groupProgressData[group].push({
                        date: date,
                        progress: avgProgress,
                        timestamp: snapshot.timestamp,
                        count: count
                    });
                }
            });
        });
        
        // Sort data points by timestamp for each group
        groups.forEach(group => {
            groupProgressData[group].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        
        // Find all unique dates
        const allDates = new Set();
        groups.forEach(group => {
            groupProgressData[group].forEach(point => allDates.add(point.timestamp));
        });
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
        
        if (sortedDates.length === 0) {
            container.innerHTML = `
                <div class="okr-empty-state">
                    <span>📈</span>
                    <p>No data matches the selected filters.</p>
                </div>
            `;
            return;
        }
        
        // Create a single chart with all groups
        const chartHeight = 300;
        const chartWidth = 800;
        const padding = 50;
        const usableWidth = chartWidth - (padding * 2);
        const usableHeight = chartHeight - (padding * 2);
        const maxProgress = 100;
        
        // Generate paths for each group
        const paths = groups.map(group => {
            const dataPoints = groupProgressData[group];
            if (dataPoints.length === 0) return null;
            
            let pathData = '';
            dataPoints.forEach((point, index) => {
                const dateIndex = sortedDates.indexOf(point.timestamp);
                const x = padding + (dateIndex / (sortedDates.length - 1 || 1)) * usableWidth;
                const y = padding + usableHeight - (point.progress / maxProgress) * usableHeight;
                
                if (index === 0) {
                    pathData += `M ${x} ${y}`;
                } else {
                    pathData += ` L ${x} ${y}`;
                }
            });
            
            return { group, pathData, dataPoints, color: groupColors[group] };
        }).filter(p => p !== null);
        
        // Generate points for tooltips
        const allPoints = [];
        paths.forEach(path => {
            path.dataPoints.forEach((point, index) => {
                const dateIndex = sortedDates.indexOf(point.timestamp);
                const x = padding + (dateIndex / (sortedDates.length - 1 || 1)) * usableWidth;
                const y = padding + usableHeight - (point.progress / maxProgress) * usableHeight;
                allPoints.push({ x, y, progress: point.progress, date: point.date, group: path.group, count: point.count });
            });
        });
        
        container.innerHTML = `
            <div class="okr-trend-chart-container">
                <div class="okr-trend-chart-header">
                    <h4>Overall Progress by Category</h4>
                </div>
                <div class="okr-trend-chart-wrapper">
                    <svg class="okr-trend-chart" viewBox="0 0 ${chartWidth} ${chartHeight}">
                        <!-- Grid lines -->
                        ${[0, 25, 50, 75, 100].map(percent => {
                            const y = padding + usableHeight - (percent / maxProgress) * usableHeight;
                            return `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2,2" opacity="0.3"/>`;
                        }).join('')}
                        
                        <!-- Progress lines for each group -->
                        ${paths.map(path => `
                            <path d="${path.pathData}" fill="none" stroke="${path.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        `).join('')}
                        
                        <!-- Data points -->
                        ${allPoints.map(p => `
                            <circle cx="${p.x}" cy="${p.y}" r="4" fill="${groupColors[p.group]}" stroke="rgba(30,30,30,0.95)" stroke-width="2">
                                <title>${p.group}: ${p.date} - ${p.progress}% (${p.count} objective${p.count !== 1 ? 's' : ''})</title>
                            </circle>
                        `).join('')}
                        
                        <!-- Y-axis labels -->
                        ${[0, 25, 50, 75, 100].map(percent => {
                            const y = padding + usableHeight - (percent / maxProgress) * usableHeight;
                            return `<text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.6)">${percent}%</text>`;
                        }).join('')}
                        
                        <!-- X-axis labels -->
                        ${sortedDates.map((timestamp, index) => {
                            const date = new Date(timestamp).toLocaleDateString();
                            const x = padding + (index / (sortedDates.length - 1 || 1)) * usableWidth;
                            const showLabel = index === 0 || index === sortedDates.length - 1 || sortedDates.length <= 5;
                            if (!showLabel) return '';
                            return `<text x="${x}" y="${chartHeight - padding + 20}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.6)">${date}</text>`;
                        }).join('')}
                    </svg>
                </div>
                <div class="okr-trend-chart-legend">
                    ${paths.map(path => `
                        <div class="okr-trend-legend-item">
                            <span class="okr-trend-legend-color" style="background: ${path.color}"></span>
                            <span class="okr-trend-legend-label">${path.group}</span>
                            ${path.dataPoints.length > 0 ? `
                                <span class="okr-trend-legend-value">${path.dataPoints[path.dataPoints.length - 1].progress}%</span>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual progress trends
     */
    renderIndividualProgressTrends(container, snapshots) {
        const filterGroup = document.getElementById('okr-trends-filter-group')?.value || 'all';
        const filterObjective = document.getElementById('okr-trends-filter-objective')?.value || 'all';
        
        // Extract progress data - only for objectives that still exist
        const progressData = {};
        const existingObjectiveIds = new Set((this.data.objectives || []).map(obj => obj.id));
        
        snapshots.forEach(snapshot => {
            const date = new Date(snapshot.timestamp).toLocaleDateString();
            const snapshotData = snapshot.changes.snapshot;
            
            Object.keys(snapshotData.objectives).forEach(objId => {
                if (!existingObjectiveIds.has(objId)) return;
                
                const objData = snapshotData.objectives[objId];
                
                // Apply filters
                if (filterGroup !== 'all' && objData.group !== filterGroup) return;
                if (filterObjective !== 'all' && objId !== filterObjective) return;
                
                if (!progressData[objId]) {
                    const currentObj = this.data.objectives.find(o => o.id === objId);
                    progressData[objId] = {
                        title: currentObj ? currentObj.title : objData.title,
                        group: objData.group,
                        dataPoints: []
                    };
                }
                
                progressData[objId].dataPoints.push({
                    date: date,
                    progress: objData.progress,
                    timestamp: snapshot.timestamp
                });
            });
        });
        
        if (Object.keys(progressData).length === 0) {
            container.innerHTML = `
                <div class="okr-empty-state">
                    <span>📈</span>
                    <p>No data matches the selected filters.</p>
                </div>
            `;
            return;
        }
        
        // Update objective filter dropdown
        this.updateTrendsObjectiveFilter(progressData, filterObjective);
        
        // Render charts
        container.innerHTML = Object.keys(progressData).map(objId => {
            const objData = progressData[objId];
            const dataPoints = objData.dataPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            if (dataPoints.length === 0) return '';
            
            const maxProgress = Math.max(...dataPoints.map(d => d.progress), 100);
            const chartHeight = 200;
            const chartWidth = 600;
            const padding = 40;
            const usableWidth = chartWidth - (padding * 2);
            const usableHeight = chartHeight - (padding * 2);
            
            // Generate SVG path for line chart
            let pathData = '';
            dataPoints.forEach((point, index) => {
                const x = padding + (index / (dataPoints.length - 1 || 1)) * usableWidth;
                const y = padding + usableHeight - (point.progress / maxProgress) * usableHeight;
                
                if (index === 0) {
                    pathData += `M ${x} ${y}`;
                } else {
                    pathData += ` L ${x} ${y}`;
                }
            });
            
            // Generate points
            const points = dataPoints.map((point, index) => {
                const x = padding + (index / (dataPoints.length - 1 || 1)) * usableWidth;
                const y = padding + usableHeight - (point.progress / maxProgress) * usableHeight;
                return { x, y, progress: point.progress, date: point.date };
            });
            
            return `
                <div class="okr-trend-chart-container">
                    <div class="okr-trend-chart-header">
                        <h4>${this.escapeHtml(objData.title)}</h4>
                        <span class="okr-trend-group-badge okr-trend-group-${objData.group.toLowerCase()}">${objData.group}</span>
                    </div>
                    <div class="okr-trend-chart-wrapper">
                        <svg class="okr-trend-chart" viewBox="0 0 ${chartWidth} ${chartHeight}">
                            <!-- Grid lines -->
                            ${[0, 25, 50, 75, 100].map(percent => {
                                const y = padding + usableHeight - (percent / maxProgress) * usableHeight;
                                return `<line x1="${padding}" y1="${y}" x2="${chartWidth - padding}" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2,2" opacity="0.3"/>`;
                            }).join('')}
                            
                            <!-- Progress line -->
                            <path d="${pathData}" fill="none" stroke="#667eea" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                            
                            <!-- Data points -->
                            ${points.map(p => `
                                <circle cx="${p.x}" cy="${p.y}" r="4" fill="#667eea" stroke="rgba(30,30,30,0.95)" stroke-width="2">
                                    <title>${p.date}: ${p.progress}%</title>
                                </circle>
                            `).join('')}
                            
                            <!-- Y-axis labels -->
                            ${[0, 25, 50, 75, 100].map(percent => {
                                const y = padding + usableHeight - (percent / maxProgress) * usableHeight;
                                return `<text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="rgba(255,255,255,0.6)">${percent}%</text>`;
                            }).join('')}
                            
                            <!-- X-axis labels -->
                            ${dataPoints.map((point, index) => {
                                const x = padding + (index / (dataPoints.length - 1 || 1)) * usableWidth;
                                const showLabel = index === 0 || index === dataPoints.length - 1 || dataPoints.length <= 5;
                                if (!showLabel) return '';
                                return `<text x="${x}" y="${chartHeight - padding + 20}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.6)">${point.date}</text>`;
                            }).join('')}
                        </svg>
                    </div>
                    <div class="okr-trend-chart-stats">
                        <div class="okr-trend-stat">
                            <span class="okr-trend-stat-label">Current:</span>
                            <span class="okr-trend-stat-value">${dataPoints[dataPoints.length - 1].progress}%</span>
                        </div>
                        ${dataPoints.length > 1 ? `
                            <div class="okr-trend-stat">
                                <span class="okr-trend-stat-label">Change:</span>
                                <span class="okr-trend-stat-value ${dataPoints[dataPoints.length - 1].progress >= dataPoints[0].progress ? 'okr-trend-positive' : 'okr-trend-negative'}">
                                    ${dataPoints[dataPoints.length - 1].progress >= dataPoints[0].progress ? '+' : ''}${dataPoints[dataPoints.length - 1].progress - dataPoints[0].progress}%
                                </span>
                            </div>
                            <div class="okr-trend-stat">
                                <span class="okr-trend-stat-label">Data Points:</span>
                                <span class="okr-trend-stat-value">${dataPoints.length}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update trends objective filter dropdown
     */
    updateTrendsObjectiveFilter(progressData, selectedId) {
        const filterSelect = document.getElementById('okr-trends-filter-objective');
        if (!filterSelect) return;
        
        const currentValue = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">All Objectives</option>';
        
        Object.keys(progressData).forEach(objId => {
            const obj = this.data.objectives.find(o => o.id === objId);
            if (obj) {
                const option = document.createElement('option');
                option.value = objId;
                option.textContent = obj.title;
                if (objId === currentValue) {
                    option.selected = true;
                }
                filterSelect.appendChild(option);
            }
        });
    }

    /**
     * Set up progress trends filter listeners
     */
    setupProgressTrendsFilters() {
        const groupFilter = document.getElementById('okr-trends-filter-group');
        const objectiveFilter = document.getElementById('okr-trends-filter-objective');
        const viewModeRadios = document.querySelectorAll('input[name="okr-trends-view"]');
        
        if (groupFilter) {
            groupFilter.addEventListener('change', () => {
                this.renderProgressTrends();
            });
        }
        if (objectiveFilter) {
            objectiveFilter.addEventListener('change', () => {
                this.renderProgressTrends();
            });
        }
        if (viewModeRadios.length > 0) {
            viewModeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    this.renderProgressTrends();
                });
            });
        }
    }

    /**
     * Open history modal
     */
    openHistoryModal() {
        this.renderHistory();
        document.getElementById('okr-history-modal').classList.add('active');
    }

    /**
     * Render history view
     */
    renderHistory() {
        const container = document.getElementById('okr-history-list');
        if (!container) return;
        
        if (!this.data.history || this.data.history.length === 0) {
            container.innerHTML = `
                <div class="okr-empty-state">
                    <span>📊</span>
                    <p>No history available yet. Changes will be tracked as you work with your OKRs.</p>
                </div>
            `;
            return;
        }
        
        const filterType = document.getElementById('okr-history-filter-type')?.value || 'all';
        const filterGroup = document.getElementById('okr-history-filter-group')?.value || 'all';
        
        let filteredHistory = this.data.history;
        
        if (filterType !== 'all') {
            filteredHistory = filteredHistory.filter(entry => entry.itemType === filterType);
        }
        
        if (filterGroup !== 'all') {
            filteredHistory = filteredHistory.filter(entry => entry.group === filterGroup);
        }
        
        if (filteredHistory.length === 0) {
            container.innerHTML = `
                <div class="okr-empty-state">
                    <span>📊</span>
                    <p>No history matches the selected filters.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredHistory.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            const typeIcon = entry.itemType === 'objective' ? '🎯' : '📊';
            const typeLabel = entry.itemType === 'objective' ? 'Objective' : 'Key Result';
            
            let changeDescription = '';
            if (entry.type === 'created') {
                changeDescription = '';
            } else if (entry.type === 'deleted') {
                changeDescription = '';
            } else if (entry.type === 'progress') {
                changeDescription = `${entry.changes.progress.from} → ${entry.changes.progress.to}`;
            } else if (entry.type === 'updated') {
                const changeList = Object.keys(entry.changes).map(key => {
                    const change = entry.changes[key];
                    if (key === 'status') {
                        return `${key}: ${this.getStatusLabel(change.from)} → ${this.getStatusLabel(change.to)}`;
                    }
                    return `${key}: ${change.from} → ${change.to}`;
                }).join(', ');
                changeDescription = changeList;
            }
            
            return `
                <div class="okr-history-entry">
                    <div class="okr-history-entry-header">
                        <span class="okr-history-type-icon">${typeIcon}</span>
                        <span class="okr-history-item-type">${typeLabel}</span>
                        <span class="okr-history-item-title">${this.escapeHtml(entry.itemTitle)}</span>
                        ${entry.group ? `<span class="okr-history-group-badge okr-history-group-${entry.group.toLowerCase()}">${entry.group}</span>` : ''}
                        <span class="okr-history-timestamp">${dateStr}</span>
                    </div>
                    <div class="okr-history-entry-details">
                        <span class="okr-history-change-type okr-history-change-${entry.type}">${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</span>
                        <span class="okr-history-change-description">${changeDescription}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Set up history filter listeners
     */
    setupHistoryFilters() {
        const typeFilter = document.getElementById('okr-history-filter-type');
        const groupFilter = document.getElementById('okr-history-filter-group');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.renderHistory();
            });
        }
        if (groupFilter) {
            groupFilter.addEventListener('change', () => {
                this.renderHistory();
            });
        }
    }
}

// Export the module class - must match the module directory name
// Core framework will look for window['okr-tracker'] or window.okrtracker
window['okr-tracker'] = OKRTracker;
window.okrtracker = OKRTracker; // Alternative without hyphen

