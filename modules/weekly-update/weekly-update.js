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
                entries: [{ title: '', content: '', county: 'N/A', process: 'DR', type: 'Info' }]
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
            section.entries.push({ title: '', content: '', county: 'N/A', process: 'DR', type: 'Info' });
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
     * Update entry field (process)
     */
    updateEntryField(index, field, value) {
        const section = this.getActiveSection();
        if (section && section.entries[index]) {
            section.entries[index][field] = value;
            this.saveData();
            // Re-render to update tab labels when process changes
            if (field === 'process') {
                this.renderAndAttach();
            }
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
                entries: [{ title: '', content: '', county: 'N/A', process: 'DR', type: 'Info' }]
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
     * Get week of the year from a date string (YYYY-MM-DD format)
     * Uses ISO 8601 week numbering (week 1 is the first week with a Thursday)
     */
    getWeekOfYear(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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

            const weekNumber = this.getWeekOfYear(section.date);
            text += `DATE : ${section.date} (Week ${weekNumber})\n\n`;
            text += `REGION  : ${section.region}\n\n`;

            section.entries.forEach(entry => {
                // Export entry if it has title, content, or process
                const hasData = entry.title.trim() || entry.content.trim() || (entry.process && entry.process.trim() !== 'DR');
                if (hasData) {
                    text += `\tPROCESS : ${entry.process || 'DR'}\n`;
                    text += `\tTYPE    : ${entry.type || 'Info'}\n`;
                    text += `\tTITLE   : ${entry.title || ''}\n`;
                    
                    // Format detail - first line on same line as DETAIL label, subsequent lines aligned
                    const contentLines = entry.content.split('\n');
                    if (contentLines.length > 0 && contentLines[0].trim()) {
                        // First line uses tab + "DETAIL  : " + content
                        // Tab typically = 8 spaces, "DETAIL  : " = 10 characters
                        // To align subsequent lines with content start + 4 chars, we need:
                        // 8 (tab) + 10 ("DETAIL  : ") + 4 - 8 (correction) = 14 spaces
                        text += `\tDETAIL  : ${contentLines[0]}\n`;
                        // Subsequent lines: use spaces to match tab width + label + 4 extra chars - 8 correction
                        const tabWidth = 8; // Standard tab width
                        const labelWidth = 'DETAIL  : '.length; // 10 characters
                        const extraIndent = 4; // 4 characters to the right
                        const indent = ' '.repeat(tabWidth + labelWidth + extraIndent - 8); // 14 spaces (22 - 8 correction)
                        for (let i = 1; i < contentLines.length; i++) {
                            text += `${indent}${contentLines[i]}\n`;
                        }
                    } else {
                        text += `\tDETAIL  :\n`;
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
     * Build Outlook-friendly HTML body for clipboard/email exports.
     * Uses simple HTML and <font color> for best compatibility.
     */
    buildOutlookHtmlBody() {
        let html = '';

        const fontBase = 'font-family: Calibri, Arial, sans-serif; font-size: 12pt; color: #000;';
        const cellBase = 'border: 1px solid #000; padding: 6px 10px; vertical-align: top;';

        this.sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                // Page break between sections (Outlook/Word rendering)
                html += '<div style="page-break-before: always;"></div>';
                // Outlook/Word can "collapse" sections unless there is actual content separation.
                // Add two blank lines to prevent the next section from merging visually.
                html += '<p style="margin:0; line-height:1;"><br></p>';
                html += '<p style="margin:0; line-height:1;"><br></p>';
            }

            const weekNumber = this.getWeekOfYear(section.date);
            const dateText = `${section.date} (Week ${weekNumber})`;

            // One header per section (DATE | REGION), then child blocks for each entry
            html += `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="${fontBase} border-collapse: collapse; table-layout: fixed;">`;

            // Header row: DATE | REGION (only once per section) - blue fill like the template
            html += `<tr>`;
            html += `<td style="${cellBase} width: 50%; background-color: #1e5aa8; color: #ffffff;"><b>DATE</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.escapeHtml(dateText)}</td>`;
            html += `<td style="${cellBase} width: 50%; background-color: #1e5aa8; color: #ffffff;"><b>REGION</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${this.escapeHtml(section.region || '')}</td>`;
            html += `</tr>`;

            let hasAnyEntry = false;
            (section.entries || []).forEach((entry, entryIndex) => {
                const hasData = entry.title.trim() || entry.content.trim() || (entry.process && entry.process.trim() !== 'DR');
                if (!hasData) return;
                hasAnyEntry = true;

                const entryType = entry.type || 'Info';
                let typeColor = '#008000'; // default green
                if (entryType === 'Action') typeColor = '#0000FF';
                else if (entryType === 'Urgent') typeColor = '#FF0000';

                const processText = this.escapeHtml(entry.process || 'DR');
                const titleText = this.escapeHtml(entry.title || '');
                const detailHtml = this.escapeHtml(entry.content || '').replace(/\n/g, '<br>');

                // Spacer between child entries
                html += `<tr><td colspan="2" style="height: ${entryIndex === 0 ? 12 : 16}px;"></td></tr>`;

                // Child row: TYPE | PROCESS
                html += `<tr>`;
                html += `<td style="${cellBase} width: 50%;"><b><font color="${typeColor}">${this.escapeHtml(entryType.toUpperCase())}</font></b></td>`;
                html += `<td style="${cellBase} width: 50%;"><b>${processText}</b></td>`;
                html += `</tr>`;

                // Child big box: TITLE/DETAIL
                html += `<tr>`;
                html += `<td colspan="2" style="${cellBase} padding: 0;">`;
                html += `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="${fontBase} border-collapse: collapse; table-layout: fixed;">`;
                html += `<tr>`;
                html += `<td style="width: 120px; ${cellBase} border-left: 0; border-top: 0; border-bottom: 0;"><b>TITLE</b></td>`;
                html += `<td style="${cellBase} border-right: 0; border-top: 0; border-bottom: 0;">${titleText}</td>`;
                html += `</tr>`;
                html += `<tr>`;
                // Keep the DETAIL row, but remove the "DETAIL" label and the horizontal divider between TITLE and DETAIL
                html += `<td style="width: 120px; ${cellBase} border-left: 0; border-top: 0; border-bottom: 0;">&nbsp;</td>`;
                html += `<td style="${cellBase} border-right: 0; border-top: 0; border-bottom: 0; padding: 14px 10px; line-height: 1.25;">${detailHtml}</td>`;
                html += `</tr>`;
                html += `</table>`;
                html += `</td>`;
                html += `</tr>`;
            });

            if (!hasAnyEntry) {
                // Keep a little space if there were no child entries (rare, but avoids empty-looking header)
                html += `<tr><td colspan="2" style="height: 10px;"></td></tr>`;
            }

            html += `</table>`;
        });

        return html;
    }

    /**
     * Export an .eml file that Outlook can open as a ready-to-send email.
     * This is more reliable than clipboard for preserving colors.
     */
    exportToOutlookEml() {
        const firstDate = this.sections[0]?.date || new Date().toISOString().split('T')[0];
        const htmlBody = this.buildOutlookHtmlBody();
        const subject = `Weekly Update - ${firstDate}`;

        // Use CRLF per RFC822
        const eml =
            `To: \r\n` +
            `Subject: ${subject}\r\n` +
            `MIME-Version: 1.0\r\n` +
            `Content-Type: text/html; charset="UTF-8"\r\n` +
            `Content-Transfer-Encoding: 8bit\r\n` +
            `\r\n` +
            `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>` +
            htmlBody +
            `</body></html>`;

        const blob = new Blob([eml], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Weekly-Update-${firstDate.replace(/\//g, '-')}.eml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Copy to clipboard as HTML for Outlook email
     */
    copyToClipboardForOutlook() {
        const html = this.buildOutlookHtmlBody();

        // Generate plain text version for fallback
        let text = '';
        this.sections.forEach((section, sectionIndex) => {
            if (sectionIndex > 0) {
                text += '\n\n';
            }
            const weekNumber = this.getWeekOfYear(section.date);
            text += `DATE : ${section.date} (Week ${weekNumber})\n\n`;
            text += `REGION  : ${section.region}\n\n`;
            section.entries.forEach(entry => {
                const hasData = entry.title.trim() || entry.content.trim() || (entry.process && entry.process.trim() !== 'DR');
                if (hasData) {
                    text += `\tPROCESS : ${entry.process || 'DR'}\n`;
                    text += `\tTYPE    : ${entry.type || 'Info'}\n`;
                    text += `\tTITLE   : ${entry.title || ''}\n`;
                    const contentLines = entry.content.split('\n');
                    if (contentLines.length > 0 && contentLines[0].trim()) {
                        text += `\tDETAIL  : ${contentLines[0]}\n`;
                        const indent = ' '.repeat(14);
                        for (let i = 1; i < contentLines.length; i++) {
                            text += `${indent}${contentLines[i]}\n`;
                        }
                    } else {
                        text += `\tDETAIL  :\n`;
                    }
                    text += '\n';
                }
            });
        });

        // Use a more reliable method for Outlook: create a temporary div with HTML content
        // and use execCommand to copy it, which preserves formatting better in Outlook
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);
        
        // Select the content
        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        try {
            // Try modern Clipboard API first with both HTML and text
            if (navigator.clipboard && navigator.clipboard.write) {
                const htmlBlob = new Blob([html], { type: 'text/html' });
                const textBlob = new Blob([text], { type: 'text/plain' });
                const clipboardItem = new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                });
                
                navigator.clipboard.write([clipboardItem]).then(() => {
                    document.body.removeChild(tempDiv);
                    selection.removeAllRanges();
                    alert('Content copied to clipboard! You can now paste it directly into Outlook.\n\nTip: In Outlook, paste using Ctrl+V (or Cmd+V on Mac) to paste with formatting.');
                }).catch(() => {
                    // Fallback to execCommand
                    document.execCommand('copy');
                    document.body.removeChild(tempDiv);
                    selection.removeAllRanges();
                    alert('Content copied to clipboard! You can now paste it directly into Outlook.\n\nTip: In Outlook, paste using Ctrl+V (or Cmd+V on Mac) to paste with formatting.');
                });
            } else {
                // Fallback to execCommand
                document.execCommand('copy');
                document.body.removeChild(tempDiv);
                selection.removeAllRanges();
                alert('Content copied to clipboard! You can now paste it directly into Outlook.\n\nTip: In Outlook, paste using Ctrl+V (or Cmd+V on Mac) to paste with formatting.');
            }
        } catch (err) {
            document.body.removeChild(tempDiv);
            selection.removeAllRanges();
            alert('Failed to copy to clipboard. Please try the text export instead.');
        }
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Export text button
        const exportTextBtn = document.getElementById('wu-export-text-btn');
        if (exportTextBtn) {
            exportTextBtn.addEventListener('click', () => {
                this.exportToText();
            });
        }

        // Export .eml for Outlook button
        const exportEmlBtn = document.getElementById('wu-export-eml-btn');
        if (exportEmlBtn) {
            exportEmlBtn.addEventListener('click', () => {
                this.exportToOutlookEml();
            });
        }

        // Copy to clipboard for Outlook button
        const copyToClipboardBtn = document.getElementById('wu-copy-clipboard-btn');
        if (copyToClipboardBtn) {
            copyToClipboardBtn.addEventListener('click', () => {
                this.copyToClipboardForOutlook();
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
            const processInput = document.getElementById(`wu-process-${this.activeEntryIndex}`);
            const typeSelect = document.getElementById(`wu-type-${this.activeEntryIndex}`);
            const titleInput = document.getElementById(`wu-title-${this.activeEntryIndex}`);
            const contentInput = document.getElementById(`wu-content-${this.activeEntryIndex}`);

            if (processInput) {
                // Save data on input (for persistence, without re-rendering)
                processInput.addEventListener('input', (e) => {
                    const section = this.getActiveSection();
                    if (section && section.entries[this.activeEntryIndex]) {
                        section.entries[this.activeEntryIndex].process = e.target.value;
                        this.saveData();
                    }
                });
                // Update tab name on blur (when user finishes editing)
                processInput.addEventListener('blur', (e) => {
                    this.updateEntryField(this.activeEntryIndex, 'process', e.target.value);
                });
            }

            if (typeSelect) {
                typeSelect.addEventListener('change', (e) => {
                    const section = this.getActiveSection();
                    if (section && section.entries[this.activeEntryIndex]) {
                        section.entries[this.activeEntryIndex].type = e.target.value;
                        this.saveData();
                    }
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
                            const process = entry.process || 'DR';
                            return `
                                <div 
                                    class="wu-entry-tab ${index === this.activeEntryIndex ? 'active' : ''}" 
                                    id="wu-entry-tab-${index}"
                                >
                                    <span>${process}::${index + 1}</span>
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
                                            <label for="wu-process-${this.activeEntryIndex}">PROCESS:</label>
                                            <input 
                                                type="text" 
                                                id="wu-process-${this.activeEntryIndex}" 
                                                class="wu-title-input"
                                                placeholder="Enter process..."
                                                value="${this.escapeHtml(activeEntry.process || 'DR')}"
                                            />
                                        </div>
                                        <div class="wu-form-field">
                                            <label for="wu-type-${this.activeEntryIndex}">TYPE:</label>
                                            <select 
                                                id="wu-type-${this.activeEntryIndex}" 
                                                class="wu-title-input"
                                            >
                                                <option value="Info" ${activeEntry.type === 'Info' ? 'selected' : ''}>Info</option>
                                                <option value="Action" ${activeEntry.type === 'Action' ? 'selected' : ''}>Action</option>
                                                <option value="Urgent" ${activeEntry.type === 'Urgent' ? 'selected' : ''}>Urgent</option>
                                            </select>
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
                                        <label for="wu-content-${this.activeEntryIndex}">DETAIL :</label>
                                        <textarea 
                                            id="wu-content-${this.activeEntryIndex}" 
                                            class="wu-content-input"
                                            placeholder="Enter detail..."
                                            rows="4"
                                        >${this.escapeHtml(activeEntry.content)}</textarea>
                                    </div>
                                </div>
                            </div>
                        `;
                    })() : ''}
                </div>

                <div class="wu-actions">
                    <button id="wu-export-text-btn" class="wu-btn-export">Export to Text File</button>
                    <button id="wu-export-eml-btn" class="wu-btn-export">Export Email (.eml for Outlook)</button>
                    <button id="wu-copy-clipboard-btn" class="wu-btn-export">Copy to Clipboard (Outlook)</button>
                </div>
            </div>
        `;
    }
}

// Export the module class - must match the module directory name
window['weekly-update'] = WeeklyUpdate;
window.weeklyUpdate = WeeklyUpdate;
