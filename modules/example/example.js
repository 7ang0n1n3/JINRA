/**
 * Example Module
 * This is a sample module demonstrating the JINRA framework structure
 */

class ExampleModule {
    constructor() {
        this.name = 'Example Module';
        this.description = 'This is an example module showing how to create plugins for JINRA';
    }

    /**
     * Initialize the module
     */
    async init() {
        console.log('Example module initialized');
        // Register menu bar button
        this.registerMenuButton();
    }

    /**
     * Register a button in the menu bar
     */
    registerMenuButton() {
        const menuBar = document.getElementById('menu-bar');
        const menuContent = menuBar.querySelector('.menu-bar-content');
        
        // Setup menu bar container if not already done
        if (!menuContent.classList.contains('menu-bar-container-setup')) {
            // Clear the default text and setup container
            menuContent.innerHTML = '';
            menuContent.classList.add('menu-bar-container-setup');
            menuContent.style.display = 'flex';
            menuContent.style.gap = '10px';
            menuContent.style.alignItems = 'center';
            menuContent.style.justifyContent = 'flex-start';
            menuContent.style.padding = '0 20px';
        }
        
        // Create button
        const button = document.createElement('button');
        button.className = 'menu-bar-button';
        button.textContent = 'Example Action';
        button.id = 'example-menu-action';
        button.style.display = 'none'; // Hidden until module is active
        button.addEventListener('click', () => {
            this.changeMainWindow();
        });
        
        menuContent.appendChild(button);
    }

    /**
     * Show/hide menu bar buttons
     */
    toggleMenuButtons(show) {
        const btn = document.getElementById('example-menu-action');
        if (btn) {
            btn.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Open/Activate the example module
     */
    open() {
        this.activate();
    }

    activate() {
        const mainWindow = document.getElementById('modules-container');
        mainWindow.innerHTML = `
            <div class="module" id="module-example">
                <div class="module-header">${this.name}</div>
                <div class="module-content">${this.render()}</div>
            </div>
        `;
        this.toggleMenuButtons(true); // Show menu bar button
    }

    /**
     * Dummy function that changes the main window
     */
    changeMainWindow() {
        const mainWindow = document.getElementById('modules-container');
        const timestamp = new Date().toLocaleTimeString();
        
        mainWindow.innerHTML = `
            <div class="module">
                <div class="module-header">Main Window Changed!</div>
                <div class="module-content">
                    <p>The main window has been updated by the Example Module.</p>
                    <p>This is a demonstration of module functionality.</p>
                    <p>Time: ${timestamp}</p>
                    <button onclick="window.jinra.reload()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Reset to Modules</button>
                </div>
            </div>
        `;
        
        console.log('Main window changed by Example Module');
    }

    /**
     * Render the module content
     */
    render() {
        return `
            <p>${this.description}</p>
            <p>This module demonstrates the basic structure for JINRA plugins.</p>
            <p>Click the "Example Action" button in the menu bar to see it change the main window!</p>
        `;
    }
}

// Export the module class - must match the module directory name
window.example = ExampleModule;

