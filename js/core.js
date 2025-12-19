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
        
        container.innerHTML = '<div class="loading">Select a module from the menu to get started</div>';

        for (const moduleName of this.settings.enabledModules) {
            try {
                await this.loadModule(moduleName);
                // Hide buttons initially - they'll show when module is activated
                const moduleInstance = this.modules.get(moduleName);
                if (moduleInstance && moduleInstance.toggleMenuButtons) {
                    moduleInstance.toggleMenuButtons(false);
                }
            } catch (error) {
                console.error(`Error loading module ${moduleName}:`, error);
                this.showError(`Failed to load module: ${moduleName}`);
            }
        }

        // Clear loading message if modules were loaded
        if (this.modules.size > 0 && container.querySelector('.loading')) {
            container.innerHTML = '<div class="loading">Select a module from the menu to get started</div>';
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
        title.textContent = 'MODULES';
        menuContent.appendChild(title);
        
        moduleNames.forEach((moduleName) => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'module-menu-item';
            moduleItem.textContent = moduleName;
            moduleItem.dataset.moduleName = moduleName;
            
            // Add click handler to load/activate module in main window
            moduleItem.addEventListener('click', () => {
                this.activateModule(moduleName);
            });
            
            menuContent.appendChild(moduleItem);
        });
    }

    /**
     * Activate a module (load it in the main window)
     */
    activateModule(moduleName) {
        // Hide all module buttons first
        this.modules.forEach((instance, name) => {
            if (instance.toggleMenuButtons) {
                instance.toggleMenuButtons(false);
            }
        });
        
        const moduleInstance = this.modules.get(moduleName);
        if (moduleInstance) {
            // Clear main window
            const container = document.getElementById('modules-container');
            container.innerHTML = '';
            
            // If module has an open/activate method, use it
            if (moduleInstance.open || moduleInstance.activate) {
                if (moduleInstance.open) {
                    moduleInstance.open();
                } else {
                    moduleInstance.activate();
                }
            } else if (moduleInstance.render) {
                // Otherwise, just render it
                container.innerHTML = `
                    <div class="module" id="module-${moduleName}">
                        <div class="module-header">${moduleInstance.name || moduleName}</div>
                        <div class="module-content">${moduleInstance.render()}</div>
                    </div>
                `;
                // Show buttons if module is now active
                if (moduleInstance.toggleMenuButtons) {
                    moduleInstance.toggleMenuButtons(true);
                }
            }
            
            // Update active state in menu
            document.querySelectorAll('.module-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`[data-module-name="${moduleName}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    }

    /**
     * Load a single module
     */
    async loadModule(moduleName) {
        try {
            // Try to load module CSS if it exists
            try {
                await this.loadStylesheet(`modules/${moduleName}/${moduleName}.css`);
            } catch (e) {
                // CSS file is optional, so we ignore errors
                console.log(`No CSS file found for module ${moduleName}`);
            }
            
            // Load module script
            const moduleScript = await this.loadScript(`modules/${moduleName}/${moduleName}.js`);
            
            // Handle module names with hyphens (e.g., "okr-tracker" -> window['okr-tracker'])
            const moduleExport = window[moduleName] || window[moduleName.replace(/-/g, '')];
            
            // Check if module has an init function
            if (typeof moduleExport === 'function' || 
                (moduleExport && typeof moduleExport.init === 'function')) {
                
                const moduleInstance = typeof moduleExport === 'function' 
                    ? new moduleExport() 
                    : moduleExport;
                
                if (moduleInstance.init) {
                    await moduleInstance.init();
                }
                
                // Store module instance (don't render yet - wait for activation)
                this.modules.set(moduleName, moduleInstance);
                
                // Allow module to register menu bar buttons if it has the method
                if (moduleInstance.registerMenuButton) {
                    moduleInstance.registerMenuButton();
                    // Hide buttons initially
                    if (moduleInstance.toggleMenuButtons) {
                        moduleInstance.toggleMenuButtons(false);
                    }
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
     * Load a stylesheet dynamically
     */
    loadStylesheet(href) {
        return new Promise((resolve, reject) => {
            // Check if stylesheet already exists
            const existing = document.querySelector(`link[href="${href}"]`);
            if (existing) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
            document.head.appendChild(link);
        });
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

