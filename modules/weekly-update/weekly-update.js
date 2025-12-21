/**
 * Weekly Update Module
 * Create and export weekly updates in a specific text format
 */

class WeeklyUpdate {
    constructor() {
        this.name = 'Weekly Update';
        this.description = 'Create and export weekly updates';
        this.sections = [
            {
                id: 1,
                date: new Date().toISOString().split('T')[0],
                region: 'JAPAN',
                entries: [{ title: '', content: '', county: 'N/A', process: 'DR' }]
            }
        ];
        this.activeSectionId = 1;
        this.nextSectionId = 2;
        this.activeEntryIndex = 0; // Track active entry index per section
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('Weekly Update module initialized');
        this.registerMenuButtons();
        this.loadData();
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

        // Remove existing button if it exists
        const existingBtn = document.getElementById('wu-add-section-btn');
        if (existingBtn && existingBtn.parentNode) {
            existingBtn.parentNode.removeChild(existingBtn);
        }

        // Create "Add New Section" button
        const addSectionBtn = document.createElement('button');
        addSectionBtn.id = 'wu-add-section-btn';
        addSectionBtn.className = 'menu-bar-button';
        addSectionBtn.textContent = 'Add New Section';
        addSectionBtn.style.display = 'none';
        addSectionBtn.addEventListener('click', () => {
            this.addNewSection();
        });
        menuContent.appendChild(addSectionBtn);

        // Create "Reset Form" button
        const resetBtn = document.createElement('button');
        resetBtn.id = 'wu-reset-btn';
        resetBtn.className = 'menu-bar-button';
        resetBtn.textContent = 'Reset Form';
        resetBtn.style.display = 'none';
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the form? This will clear all data.')) {
                this.resetForm();
            }
        });
        menuContent.appendChild(resetBtn);
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        const addSectionBtn = document.getElementById('wu-add-section-btn');
        const resetBtn = document.getElementById('wu-reset-btn');
        if (addSectionBtn) {
            addSectionBtn.style.display = show ? 'inline-block' : 'none';
        }
        if (resetBtn) {
            resetBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    /**
     * Open/Activate the weekly update module
     */
    open() {
        this.activate();
    }

    activate() {
        // Load data before rendering
        this.loadData();
        const mainWindow = document.getElementById('modules-container');
        mainWindow.innerHTML = `
            <div class="module" id="module-weekly-update">
                <div class="module-header">${this.name}</div>
                <div class="module-content">${this.render()}</div>
            </div>
        `;
        this.toggleMenuButtons(true);
        this.attachEventListeners();
    }

    /**
     * Add a new section
     */
    addNewSection() {
        const today = new Date().toISOString().split('T')[0];
        const newSection = {
            id: this.nextSectionId++,
            date: today,
            region: 'JAPAN',
            entries: [{ title: '', content: '', county: 'N/A', process: 'DR' }]
        };
        this.sections.push(newSection);
        this.activeSectionId = newSection.id;
        this.saveData();
        this.renderAndAttach();
    }

    /**
     * Remove a section
     */
    removeSection(sectionId) {
        if (this.sections.length > 1) {
            this.sections = this.sections.filter(s => s.id !== sectionId);
            if (this.activeSectionId === sectionId) {
                this.activeSectionId = this.sections[0].id;
            }
            this.saveData();
            this.renderAndAttach();
        }
    }

    /**
     * Switch to a different section
     */
    switchSection(sectionId) {
        this.activeSectionId = sectionId;
        this.activeEntryIndex = 0; // Reset to first entry when switching sections
        this.saveData();
        this.renderAndAttach();
    }

    /**
     * Switch to a different entry in active section
     */
    switchEntry(index) {
        this.activeEntryIndex = index;
        this.saveData();
        this.renderAndAttach();
    }

    /**
     * Get active section
     */
    getActiveSection() {
        return this.sections.find(s => s.id === this.activeSectionId) || this.sections[0];
    }

    /**
     * Add a new title/content entry to active section
     */
    addEntry() {
        const section = this.getActiveSection();
        if (section) {
            section.entries.push({ title: '', content: '', county: 'N/A', process: 'DR' });
            this.activeEntryIndex = section.entries.length - 1; // Switch to new entry
            this.saveData();
            this.renderAndAttach();
        }
    }

    /**
     * Remove an entry from active section
     */
    removeEntry(index) {
        const section = this.getActiveSection();
        if (section && section.entries.length > 1) {
            section.entries.splice(index, 1);
            // Adjust active entry index if needed
            if (this.activeEntryIndex >= section.entries.length) {
                this.activeEntryIndex = section.entries.length - 1;
            } else if (this.activeEntryIndex > index) {
                this.activeEntryIndex--;
            }
            this.saveData();
            this.renderAndAttach();
        }
    }

    /**
     * Update entry title in active section
     */
    updateEntryTitle(index, title) {
        const section = this.getActiveSection();
        if (section && section.entries[index]) {
            section.entries[index].title = title;
            this.saveData();
        }
    }

    /**
     * Update entry content in active section
     */
    updateEntryContent(index, content) {
        const section = this.getActiveSection();
        if (section && section.entries[index]) {
            section.entries[index].content = content;
            this.saveData();
        }
    }

    /**
     * Update entry field (county, process)
     */
    updateEntryField(index, field, value) {
        const section = this.getActiveSection();
        if (section && section.entries[index]) {
            section.entries[index][field] = value;
            this.saveData();
        }
    }

    /**
     * Update section field
     */
    updateSectionField(field, value) {
        const section = this.getActiveSection();
        if (section) {
            section[field] = value;
            this.saveData();
        }
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.sections = [
            {
                id: 1,
                date: new Date().toISOString().split('T')[0],
                region: 'JAPAN',
                entries: [{ title: '', content: '', county: 'N/A', process: 'DR' }]
            }
        ];
        this.activeSectionId = 1;
        this.nextSectionId = 2;
        this.activeEntryIndex = 0;
        localStorage.removeItem('weeklyUpdateData');
        this.renderAndAttach();
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            const dataToSave = {
                sections: this.sections,
                activeSectionId: this.activeSectionId,
                nextSectionId: this.nextSectionId,
                activeEntryIndex: this.activeEntryIndex
            };
            localStorage.setItem('weeklyUpdateData', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Error saving weekly update data:', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadData() {
        try {
            const savedData = localStorage.getItem('weeklyUpdateData');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
                    this.sections = data.sections;
                    this.activeSectionId = data.activeSectionId || 1;
                    this.nextSectionId = data.nextSectionId || this.sections.length + 1;
                    this.activeEntryIndex = data.activeEntryIndex || 0;
                }
            }
        } catch (error) {
            console.error('Error loading weekly update data:', error);
        }
    }

    /**
     * Export to text file
     */
    exportToText() {
        let text = '';

        this.sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                text += '\n\n';
            }

            text += `DATE : ${section.date}\n\n`;
            text += `REGION  : ${section.region}\n\n`;

            section.entries.forEach(entry => {
                // Export entry if it has title, content, county, or process
                const hasData = entry.title.trim() || entry.content.trim() || (entry.county && entry.county.trim() !== 'N/A') || (entry.process && entry.process.trim() !== 'DR');
                if (hasData) {
                    text += `\tCOUNTY  : ${entry.county || 'N/A'}\n`;
                    text += `\tPROCESS : ${entry.process || 'DR'}\n`;
                    text += `\tTITLE   : ${entry.title || ''}\n`;
                    
                    // Format content - first line on same line as CONTENT label, subsequent lines aligned
                    const contentLines = entry.content.split('\n');
                    if (contentLines.length > 0 && contentLines[0].trim()) {
                        // First line starts on the CONTENT line
                        // "CONTENT : " = 10 characters, tab = 8 spaces typically
                        // To align subsequent lines, we need: tab (8) + "CONTENT : " (10) = 18 characters
                        // But user wants it 4 characters back, so 18 - 4 = 14 spaces
                        text += `\tCONTENT : ${contentLines[0]}\n`;
                        // Subsequent lines align with the first line of content (after "CONTENT : ") minus 4 characters
                        const indent = '              '; // 14 spaces to align with content after "CONTENT : " minus 4 chars
                        for (let i = 1; i < contentLines.length; i++) {
                            text += `${indent}${contentLines[i]}\n`;
                        }
                    } else {
                        text += `\tCONTENT :\n`;
                    }
                    text += '\n';
                }
            });
        });

        // Create and download file
        const firstDate = this.sections[0]?.date || new Date().toISOString().split('T')[0];
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weekly-Update-${firstDate.replace(/\//g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Export button
        const exportBtn = document.getElementById('wu-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportToText();
            });
        }

        // Add entry button
        const addBtn = document.getElementById('wu-add-entry-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.addEntry();
            });
        }

        // Section tabs
        this.sections.forEach(section => {
            const tabBtn = document.getElementById(`wu-tab-${section.id}`);
            if (tabBtn) {
                tabBtn.addEventListener('click', () => {
                    this.switchSection(section.id);
                });
            }

            const removeTabBtn = document.getElementById(`wu-remove-tab-${section.id}`);
            if (removeTabBtn) {
                removeTabBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeSection(section.id);
                });
            }
        });

        // Section form fields
        const dateInput = document.getElementById('wu-date');
        const regionSelect = document.getElementById('wu-region');

        if (dateInput) {
            dateInput.addEventListener('input', (e) => {
                this.updateSectionField('date', e.target.value);
                this.renderAndAttach(); // Re-render to update tab label
            });
        }

        if (regionSelect) {
            regionSelect.addEventListener('change', (e) => {
                this.updateSectionField('region', e.target.value);
                this.renderAndAttach(); // Re-render to update tab label
            });
        }

        // Entry tabs
        const section = this.getActiveSection();
        if (section) {
            section.entries.forEach((entry, index) => {
                const entryTab = document.getElementById(`wu-entry-tab-${index}`);
                if (entryTab) {
                    entryTab.addEventListener('click', () => {
                        this.switchEntry(index);
                    });
                }

                const removeEntryBtn = document.getElementById(`wu-remove-entry-${index}`);
                if (removeEntryBtn) {
                    removeEntryBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.removeEntry(index);
                    });
                }
            });
        }

        // Active entry title and content inputs
        const activeEntry = section && section.entries[this.activeEntryIndex];
        if (activeEntry !== undefined) {
            const countyInput = document.getElementById(`wu-county-${this.activeEntryIndex}`);
            const processInput = document.getElementById(`wu-process-${this.activeEntryIndex}`);
            const titleInput = document.getElementById(`wu-title-${this.activeEntryIndex}`);
            const contentInput = document.getElementById(`wu-content-${this.activeEntryIndex}`);

            if (countyInput) {
                countyInput.addEventListener('input', (e) => {
                    this.updateEntryField(this.activeEntryIndex, 'county', e.target.value);
                });
            }

            if (processInput) {
                processInput.addEventListener('input', (e) => {
                    this.updateEntryField(this.activeEntryIndex, 'process', e.target.value);
                });
            }

            if (titleInput) {
                titleInput.addEventListener('input', (e) => {
                    this.updateEntryTitle(this.activeEntryIndex, e.target.value);
                });
            }

            if (contentInput) {
                contentInput.addEventListener('input', (e) => {
                    this.updateEntryContent(this.activeEntryIndex, e.target.value);
                });
            }
        }
    }

    /**
     * Render and attach event listeners
     */
    renderAndAttach() {
        const mainWindow = document.getElementById('modules-container');
        const moduleContent = mainWindow.querySelector('.module-content');
        if (moduleContent) {
            moduleContent.innerHTML = this.render();
            this.attachEventListeners();
        }
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
     * Render the module content
     */
    render() {
        const activeSection = this.getActiveSection();
        if (!activeSection) return '';

        // Build tab labels
        const tabLabels = this.sections.map(s => {
            const label = `${s.date} - ${s.region}`;
            return label.length > 20 ? label.substring(0, 17) + '...' : label;
        });
        
        return `
            <div class="weekly-update-container">
                <div class="wu-tabs">
                    ${this.sections.map((section, index) => `
                        <div 
                            class="wu-tab ${section.id === this.activeSectionId ? 'active' : ''}" 
                            id="wu-tab-${section.id}"
                        >
                            <span>${this.escapeHtml(tabLabels[index])}</span>
                            ${this.sections.length > 1 ? `
                                <button 
                                    id="wu-remove-tab-${section.id}" 
                                    class="wu-tab-remove"
                                    title="Remove Section"
                                >×</button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="wu-form-section">
                    <div class="wu-form-row">
                        <div class="wu-form-field">
                            <label for="wu-date">DATE:</label>
                            <input type="date" id="wu-date" value="${activeSection.date}" required>
                        </div>
                        <div class="wu-form-field">
                            <label for="wu-region">REGION:</label>
                            <select id="wu-region" required>
                                <option value="NAC" ${activeSection.region === 'NAC' ? 'selected' : ''}>NAC</option>
                                <option value="LAC" ${activeSection.region === 'LAC' ? 'selected' : ''}>LAC</option>
                                <option value="EMEA" ${activeSection.region === 'EMEA' ? 'selected' : ''}>EMEA</option>
                                <option value="APAC" ${activeSection.region === 'APAC' ? 'selected' : ''}>APAC</option>
                                <option value="JAPAN" ${activeSection.region === 'JAPAN' ? 'selected' : ''}>JAPAN</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="wu-entries-section">
                    <div class="wu-entries-header">
                        <h3>Entries</h3>
                        <button id="wu-add-entry-btn" class="wu-btn-add">+ Add Entry</button>
                    </div>
                    <div class="wu-entry-tabs">
                        ${activeSection.entries.map((entry, index) => {
                            return `
                                <div 
                                    class="wu-entry-tab ${index === this.activeEntryIndex ? 'active' : ''}" 
                                    id="wu-entry-tab-${index}"
                                >
                                    <span>Entry ${index + 1}</span>
                                    ${activeSection.entries.length > 1 ? `
                                        <button 
                                            id="wu-remove-entry-${index}" 
                                            class="wu-entry-tab-remove"
                                            title="Remove Entry"
                                        >×</button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${activeSection.entries.length > 0 && activeSection.entries[this.activeEntryIndex] ? (() => {
                        const activeEntry = activeSection.entries[this.activeEntryIndex];
                        return `
                            <div class="wu-entry-content">
                                <div class="wu-entry-card">
                                    <div class="wu-form-row">
                                        <div class="wu-form-field">
                                            <label for="wu-county-${this.activeEntryIndex}">COUNTY:</label>
                                            <input 
                                                type="text" 
                                                id="wu-county-${this.activeEntryIndex}" 
                                                class="wu-title-input"
                                                placeholder="Enter county..."
                                                value="${this.escapeHtml(activeEntry.county || 'N/A')}"
                                            />
                                        </div>
                                        <div class="wu-form-field">
                                            <label for="wu-process-${this.activeEntryIndex}">PROCESS:</label>
                                            <input 
                                                type="text" 
                                                id="wu-process-${this.activeEntryIndex}" 
                                                class="wu-title-input"
                                                placeholder="Enter process..."
                                                value="${this.escapeHtml(activeEntry.process || 'DR')}"
                                            />
                                        </div>
                                    </div>
                                    <div class="wu-entry-field">
                                        <label for="wu-title-${this.activeEntryIndex}">TITLE:</label>
                                        <input 
                                            type="text" 
                                            id="wu-title-${this.activeEntryIndex}" 
                                            class="wu-title-input"
                                            placeholder="Enter title..."
                                            value="${this.escapeHtml(activeEntry.title)}"
                                        />
                                    </div>
                                    <div class="wu-entry-field">
                                        <label for="wu-content-${this.activeEntryIndex}">CONTENT:</label>
                                        <textarea 
                                            id="wu-content-${this.activeEntryIndex}" 
                                            class="wu-content-input"
                                            placeholder="Enter content..."
                                            rows="4"
                                        >${this.escapeHtml(activeEntry.content)}</textarea>
                                    </div>
                                </div>
                            </div>
                        `;
                    })() : ''}
                </div>

                <div class="wu-actions">
                    <button id="wu-export-btn" class="wu-btn-export">Export to Text File</button>
                </div>
            </div>
        `;
    }
}

// Export the module class - must match the module directory name
window['weekly-update'] = WeeklyUpdate;
window.weeklyUpdate = WeeklyUpdate;
