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
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('OKR Tracker module initialized');
        await this.loadData();
        this.registerMenuButton();
    }

    /**
     * Register buttons in the menu bar
     */
    registerMenuButton() {
        const menuBar = document.getElementById('menu-bar');
        const menuContent = menuBar.querySelector('.menu-bar-content');
        
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
        
        // Create buttons for OKR tracker
        const addBtn = document.createElement('button');
        addBtn.className = 'menu-bar-button';
        addBtn.textContent = '+ Add Objective';
        addBtn.id = 'okr-menu-add-objective';
        addBtn.style.display = 'none'; // Hidden until module is active
        addBtn.addEventListener('click', () => {
            this.openObjectiveModal();
        });
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'menu-bar-button';
        exportBtn.textContent = '📥 Export Report';
        exportBtn.id = 'okr-menu-export';
        exportBtn.style.display = 'none'; // Hidden until module is active
        exportBtn.addEventListener('click', () => {
            this.exportToText();
        });
        
        const helpBtn = document.createElement('button');
        helpBtn.className = 'menu-bar-button';
        helpBtn.textContent = '❓ What is OKR?';
        helpBtn.id = 'okr-menu-help';
        helpBtn.style.display = 'none'; // Hidden until module is active
        helpBtn.addEventListener('click', () => {
            document.getElementById('okr-help-modal').classList.add('active');
        });
        
        menuContent.appendChild(addBtn);
        menuContent.appendChild(exportBtn);
        menuContent.appendChild(helpBtn);
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        const buttons = ['okr-menu-add-objective', 'okr-menu-export', 'okr-menu-help'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.style.display = show ? 'block' : 'none';
            }
        });
    }

    /**
     * Load data from JSON file
     */
    async loadData() {
        try {
            // Try to load from data directory
            const response = await fetch(this.dataFile);
            if (response.ok) {
                this.data = await response.json();
            } else {
                this.data = { objectives: [] };
            }
        } catch (error) {
            console.log('No existing OKR data found, starting fresh');
            this.data = { objectives: [] };
        }
    }

    /**
     * Save data to JSON file (using download since we can't write to file system)
     */
    async saveData() {
        // Since we can't write to file system directly, we'll use localStorage as backup
        // and provide download option
        try {
            localStorage.setItem('okr_data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    /**
     * Open/Activate the OKR tracker in main window
     */
    open() {
        this.openTracker();
    }

    activate() {
        this.openTracker();
    }

    /**
     * Open the OKR tracker in main window
     */
    openTracker() {
        const mainWindow = document.getElementById('modules-container');
        mainWindow.innerHTML = this.render();
        this.attachEventListeners();
        this.renderObjectives();
        this.toggleMenuButtons(true); // Show menu bar buttons
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
                    <h3 id="okr-objective-modal-title">Add Objective</h3>
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
                        <button type="submit">Save Objective</button>
                    </form>
                </div>
            </div>

            <!-- Key Result Modal -->
            <div id="okr-kr-modal" class="okr-modal">
                <div class="okr-modal-content">
                    <span class="okr-close" data-modal="okr-kr-modal">&times;</span>
                    <h3 id="okr-kr-modal-title">Add Key Result</h3>
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
                        <button type="submit">Add Key Result</button>
                    </form>
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
                                ${obj.startDate ? `<span class="okr-obj-badge">Start: ${obj.startDate}</span>` : ''}
                                ${obj.targetDate ? `<span class="okr-obj-badge">Due: ${obj.targetDate}</span>` : ''}
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
                            <div class="okr-progress-fill" style="width: ${progress}%"></div>
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
                                        <div class="okr-kr-item" data-kr-id="${kr.id}">
                                            <div class="okr-kr-info">
                                                <div class="okr-kr-title">${this.escapeHtml(kr.title)}</div>
                                                ${kr.startDate && kr.targetDate ? `<div class="okr-kr-dates-display">Start: ${kr.startDate} → Target: ${kr.targetDate}</div>` : ''}
                                                <span class="okr-kr-weight-badge">Weight: ${kr.weight || 100}%</span>
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
                document.getElementById('okr-objective-modal-title').textContent = 'Edit Objective';
                document.getElementById('okr-objective-group').value = obj.group || 'Personal';
                document.getElementById('okr-objective-year').value = obj.year || new Date().getFullYear();
                document.getElementById('okr-objective-quarter').value = obj.quarter || '1';
                document.getElementById('okr-objective-title').value = obj.title;
                document.getElementById('okr-objective-purpose').value = obj.purpose || '';
                document.getElementById('okr-objective-start-date').value = obj.startDate || '';
                document.getElementById('okr-objective-target-date').value = obj.targetDate || '';
                document.getElementById('okr-objective-weight').value = obj.weight || 100;
            }
        } else {
            document.getElementById('okr-objective-modal-title').textContent = 'Add Objective';
            document.getElementById('okr-objective-year').value = new Date().getFullYear();
            const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
            document.getElementById('okr-objective-quarter').value = currentQuarter;
            document.getElementById('okr-objective-start-date').value = new Date().toISOString().split('T')[0];
        }
        
        document.getElementById('okr-objective-modal').classList.add('active');
        document.getElementById('okr-objective-title').focus();
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
            weight: parseInt(document.getElementById('okr-objective-weight').value)
        };
        
        if (!formData.title) return;
        
        if (editId) {
            const obj = this.data.objectives.find(o => o.id === editId);
            if (obj) {
                Object.assign(obj, formData);
            }
        } else {
            this.data.objectives.push({
                id: this.generateId(),
                ...formData,
                keyResults: [],
                createdAt: new Date().toISOString()
            });
        }
        
        await this.saveData();
        this.renderObjectives();
        document.getElementById('okr-objective-modal').classList.remove('active');
    }

    /**
     * Delete objective
     */
    async deleteObjective(id) {
        if (!confirm('Delete this objective and all its key results?')) return;
        this.data.objectives = this.data.objectives.filter(obj => obj.id !== id);
        await this.saveData();
        this.renderObjectives();
    }

    /**
     * Open KR modal
     */
    openKRModal(objectiveId, krId = null) {
        document.getElementById('okr-kr-objective-id').value = objectiveId;
        document.getElementById('okr-kr-edit-id').value = krId || '';
        
        if (krId) {
            const objective = this.data.objectives.find(obj => obj.id === objectiveId);
            const kr = objective?.keyResults?.find(k => k.id === krId);
            if (kr) {
                document.getElementById('okr-kr-modal-title').textContent = 'Edit Key Result';
                document.getElementById('okr-kr-title').value = kr.title;
                document.getElementById('okr-kr-target').value = kr.target;
                document.getElementById('okr-kr-start-date').value = kr.startDate || '';
                document.getElementById('okr-kr-target-date').value = kr.targetDate || '';
                document.getElementById('okr-kr-weight').value = kr.weight || 100;
            }
        } else {
            document.getElementById('okr-kr-modal-title').textContent = 'Add Key Result';
            document.getElementById('okr-kr-title').value = '';
            document.getElementById('okr-kr-target').value = '100';
            document.getElementById('okr-kr-start-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('okr-kr-target-date').value = '';
            document.getElementById('okr-kr-weight').value = '100';
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
        
        if (!title || !target || !startDate || !targetDate) return;
        
        const objective = this.data.objectives.find(obj => obj.id === objectiveId);
        if (objective) {
            if (!objective.keyResults) objective.keyResults = [];
            
            if (editId) {
                const kr = objective.keyResults.find(k => k.id === editId);
                if (kr) {
                    kr.title = title;
                    kr.target = target;
                    kr.current = Math.min(kr.current, target);
                    kr.startDate = startDate;
                    kr.targetDate = targetDate;
                    kr.weight = weight;
                }
            } else {
                objective.keyResults.push({
                    id: this.generateId(),
                    title: title,
                    target: target,
                    current: 0,
                    startDate: startDate,
                    targetDate: targetDate,
                    weight: weight,
                    createdAt: new Date().toISOString()
                });
            }
            
            await this.saveData();
            this.renderObjectives();
            document.getElementById('okr-kr-modal').classList.remove('active');
        }
    }

    /**
     * Update KR progress
     */
    async updateKR(objectiveId, krId, delta) {
        const objective = this.data.objectives.find(obj => obj.id === objectiveId);
        if (objective) {
            const kr = objective.keyResults.find(k => k.id === krId);
            if (kr) {
                kr.current = Math.max(0, Math.min(kr.target, kr.current + delta));
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
            objective.keyResults = objective.keyResults.filter(k => k.id !== krId);
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
            text += `Group:       ${obj.group || 'Personal'}\n`;
            text += `Period:      ${obj.year || ''} Q${obj.quarter || ''}\n`;
            text += `Weight:      ${obj.weight || 100}%\n`;
            text += `Start Date:  ${obj.startDate || 'N/A'}\n`;
            text += `Due Date:    ${obj.targetDate || 'N/A'}\n`;
            text += `Progress:    ${progress}%\n\n`;
            text += `Title:\n${obj.title}\n`;
            if (obj.purpose) {
                text += `\nPurpose:\n${obj.purpose}\n`;
            }
            
            if (obj.keyResults && obj.keyResults.length > 0) {
                text += '\nKey Results:\n';
                obj.keyResults.forEach((kr, krIndex) => {
                    const krProgress = Math.min(100, Math.round((kr.current / kr.target) * 100));
                    text += `\n  ${krIndex + 1}. ${kr.title}\n`;
                    text += `     Progress: ${kr.current}/${kr.target} (${krProgress}%)\n`;
                    if (kr.startDate && kr.targetDate) {
                        text += `     Period: ${kr.startDate} → ${kr.targetDate}\n`;
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
}

// Export the module class - must match the module directory name
// Core framework will look for window['okr-tracker'] or window.okrtracker
window['okr-tracker'] = OKRTracker;
window.okrtracker = OKRTracker; // Alternative without hyphen

