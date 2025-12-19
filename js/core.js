/**
 * JINRA Framework Core
 * A modular, offline framework for loading and managing plugins
 */

class JINRAFramework {
    constructor() {
        this.modules = new Map();
        this.settings = null;
        this.libraries = new Map();
    }

    /**
     * Initialize the framework
     */
    async init() {
        try {
            // Load settings
            await this.loadSettings();
            
            // Load libraries first
            await this.loadLibraries();
            
            // Load modules based on settings
            await this.loadModules();
            
            console.log('JINRA Framework initialized successfully');
        } catch (error) {
            console.error('Failed to initialize framework:', error);
            this.showError('Failed to initialize framework: ' + error.message);
        }
    }

    /**
     * Load settings from data/settings.js (loaded as script tag)
     */
    async loadSettings() {
        try {
            // Settings are loaded via script tag in index.html as window.JINRASettings
            if (window.JINRASettings) {
                this.settings = window.JINRASettings;
                console.log('Settings loaded:', this.settings);
            } else {
                throw new Error('JINRASettings not found. Make sure data/settings.js is loaded.');
            }
            
            // Validate settings structure
            if (!this.settings.enabledModules) {
                console.warn('Settings missing enabledModules, using empty array');
                this.settings.enabledModules = [];
            }
            if (!this.settings.enabledLibraries) {
                this.settings.enabledLibraries = [];
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Create default settings if file doesn't exist
            this.settings = {
                enabledModules: [],
                enabledLibraries: []
            };
            // Show error to user
            this.showError('Failed to load settings. Using default (no modules enabled). Check browser console for details.');
        }
    }

    /**
     * Load libraries from libs directory based on settings
     */
    async loadLibraries() {
        if (!this.settings || !this.settings.enabledLibraries) {
            return;
        }

        for (const libName of this.settings.enabledLibraries) {
            try {
                const script = document.createElement('script');
                script.src = `libs/${libName}.js`;
                script.onload = () => {
                    console.log(`Library loaded: ${libName}`);
                    this.libraries.set(libName, true);
                };
                script.onerror = () => {
                    console.error(`Failed to load library: ${libName}`);
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error(`Error loading library ${libName}:`, error);
            }
        }
    }

    /**
     * Load modules from modules directory based on settings
     */
    async loadModules() {
        const container = document.getElementById('modules-container');
        const moduleMenu = document.getElementById('module-menu');
        
        console.log('Loading modules. Settings:', this.settings);
        console.log('Enabled modules:', this.settings?.enabledModules);
        
        if (!this.settings || !this.settings.enabledModules || this.settings.enabledModules.length === 0) {
            console.warn('No modules enabled in settings');
            container.innerHTML = '<div class="loading">No modules enabled. Edit data/settings.json to enable modules.</div>';
            const menuContent = moduleMenu.querySelector('.module-menu-content');
            if (menuContent) {
                menuContent.textContent = 'No modules';
            }
            return;
        }

        // Update module menu
        this.updateModuleMenu(this.settings.enabledModules);
        
        container.innerHTML = '<div class="loading">Loading modules...</div>';

        for (const moduleName of this.settings.enabledModules) {
            try {
                await this.loadModule(moduleName);
            } catch (error) {
                console.error(`Error loading module ${moduleName}:`, error);
                this.showError(`Failed to load module: ${moduleName}`);
            }
        }

        // Update container if no modules were successfully loaded
        if (container.children.length === 0 || 
            (container.children.length === 1 && container.children[0].classList.contains('loading'))) {
            container.innerHTML = '<div class="loading">No modules available.</div>';
        }
    }

    /**
     * Update the module menu with list of enabled modules
     */
    updateModuleMenu(moduleNames) {
        const moduleMenu = document.getElementById('module-menu');
        const menuContent = moduleMenu.querySelector('.module-menu-content');
        
        // Clear existing content
        menuContent.innerHTML = '';
        
        // Create module list
        const title = document.createElement('div');
        title.className = 'module-menu-title';
        title.textContent = 'MODULE MENU';
        menuContent.appendChild(title);
        
        moduleNames.forEach((moduleName) => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'module-menu-item';
            moduleItem.textContent = moduleName;
            
            // Add click handler to scroll to module in main window
            moduleItem.addEventListener('click', () => {
                const moduleElement = document.getElementById(`module-${moduleName}`);
                if (moduleElement) {
                    moduleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            
            menuContent.appendChild(moduleItem);
        });
    }

    /**
     * Load a single module
     */
    async loadModule(moduleName) {
        try {
            // Load module script
            const moduleScript = await this.loadScript(`modules/${moduleName}/${moduleName}.js`);
            
            // Check if module has an init function
            if (typeof window[moduleName] === 'function' || 
                (window[moduleName] && typeof window[moduleName].init === 'function')) {
                
                const moduleInstance = typeof window[moduleName] === 'function' 
                    ? new window[moduleName]() 
                    : window[moduleName];
                
                if (moduleInstance.init) {
                    await moduleInstance.init();
                }
                
                // Render module
                this.renderModule(moduleName, moduleInstance);
                this.modules.set(moduleName, moduleInstance);
                
                // Allow module to register menu bar buttons if it has the method
                if (moduleInstance.registerMenuButton) {
                    moduleInstance.registerMenuButton();
                }
                
                console.log(`Module loaded: ${moduleName}`);
            } else {
                throw new Error(`Module ${moduleName} does not export a valid class or object`);
            }
        } catch (error) {
            console.error(`Error loading module ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Load a script dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Render a module in the UI
     */
    renderModule(moduleName, moduleInstance) {
        const container = document.getElementById('modules-container');
        
        // Remove loading message if present
        const loading = container.querySelector('.loading');
        if (loading) {
            loading.remove();
        }

        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'module';
        moduleDiv.id = `module-${moduleName}`;

        const header = document.createElement('div');
        header.className = 'module-header';
        header.textContent = moduleInstance.name || moduleName;

        const content = document.createElement('div');
        content.className = 'module-content';
        
        // If module has a render method, use it
        if (moduleInstance.render) {
            content.innerHTML = moduleInstance.render();
        } else {
            content.textContent = moduleInstance.description || 'Module loaded successfully';
        }

        moduleDiv.appendChild(header);
        moduleDiv.appendChild(content);
        container.appendChild(moduleDiv);
    }

    /**
     * Show an error message
     */
    showError(message) {
        const container = document.getElementById('modules-container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        container.appendChild(errorDiv);
    }

    /**
     * Reload modules (useful after settings change)
     */
    async reload() {
        this.modules.clear();
        const container = document.getElementById('modules-container');
        container.innerHTML = '';
        await this.init();
    }
}

// Initialize framework when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.jinra = new JINRAFramework();
    window.jinra.init();
});

