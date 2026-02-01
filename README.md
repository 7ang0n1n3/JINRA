# JINRA
Command Center web app framework

A fully offline, modular framework built with HTML, CSS, and JavaScript. Functions and features can be added or removed via a settings file.

## Structure

- **`data/`** - Settings and configuration files
  - `settings.js` - Main settings file that controls which modules and libraries are enabled (JavaScript format for offline compatibility)
- **`js/`** - JavaScript libraries (external dependencies)
- **`modules/`** - Standalone plugin modules
  - Each module should be in its own directory with a `.js` file and optional `.css` file
  - Example: `modules/example/example.js`
- **`styles/`** - CSS stylesheets for the main framework

## Available Modules

### Example (`example`)
A template module demonstrating basic module structure and functionality. Useful as a starting point for creating new modules.

### OKR Tracker (`okr-tracker`)
Comprehensive Objectives and Key Results (OKRs) tracking system with advanced features:

**Core Features:**
- Create and manage objectives with weights
- Add key results to objectives with auto-balancing weights
- Status tracking (On Track / Off Track / At Risk) with color-coded indicators
- Progress tracking with visual progress bars and dashboard charts
- Date tracking (Created, Start Date, Target Date, Last Check-in)

**Key Results Enhancements:**
- **Confidence Level**: Track confidence in achieving key results (Low, Medium, High)
- **Evidence**: Add supporting evidence for progress claims
- **Comments**: Add notes and comments to key results
- Visual confidence badges with color coding

**History & Analytics:**
- **Change History**: Complete audit trail of all changes (objectives, key results, progress updates)
- **Progress Trends**: Visual charts showing progress over time
  - Grouped view: All objectives and key results together
  - Individual view: Detailed trends for each objective/key result
  - Filterable by date range and objective/key result
- **Progress Snapshots**: Automatic recording of progress at each update
- History modal with filtering and search capabilities

**Data Management:**
- Save/load data using File System Access API (Chrome, Edge, Opera)
- Automatic localStorage fallback for browsers without File System API
- **Auto-load last file**: Automatically loads the last opened file on page reload
- File name display in the interface
- Export comprehensive reports to text files
- Create new files or open existing ones

**User Interface:**
- Clean, modern dashboard with progress visualization
- Modal windows for creating/editing objectives and key results
- Tab-based navigation for multiple objectives
- Responsive design with smooth animations

### Timer (`timer`)
Multiple timer and countdown functionality:

- Create unlimited timers (stopwatch style)
- Create unlimited countdown timers with HH:MM:SS format
- Start/stop/reset controls for each timer
- Visual feedback (blinking) when countdown reaches zero
- Persistent timers that continue running when switching modules
- Add custom names to timers and countdowns
- Delete individual timers/countdowns
- Clean, minimal interface without header panels

### Weekly Update (`weekly-update`)
Create and export weekly updates in a structured format optimized for Outlook:

**Data Entry:**
- Multiple sections with date and region (NAC, LAC, EMEA, APAC, JAPAN)
- Multiple entries per section with:
  - **TYPE**: Info (green), Action (blue), Urgent (red) - color-coded
  - **PROCESS**: Custom process identifier
  - **TITLE**: Entry title
  - **DETAIL**: Detailed content with multi-line support
- Tab-based interface for sections and entries
- **Drag-and-drop reordering**: Reorder entry cards by dragging tabs
- Visual drag feedback with bright blue highlights
- Auto-save to browser localStorage

**Export Options:**
- **Export Email (.eml)**: Generate Outlook-compatible `.eml` files
  - Preserves all formatting including colors
  - Table-based layout with proper structure
  - DATE/REGION header cells with blue fill
  - Page breaks between sections
  - Opens directly in Outlook
- **Copy to Clipboard (Outlook)**: Copy formatted HTML to clipboard for pasting into Outlook
  - Preserves colors and formatting
  - Table layout matching the .eml export format

**Export Format Features:**
- DATE and REGION appear once per section (not repeated for each entry)
- Color-coded TYPE field (Info/Action/Urgent)
- Clean table layout with borders
- Proper page breaks between sections
- Week number calculation (ISO 8601)

**User Interface:**
- Intuitive tab-based navigation
- Add/remove sections and entries
- Reset form functionality
- Responsive design

### World Time (`world-time`)
Display current time in multiple time zones:

- Real-time clock updates
- Shows date, time, and UTC offset for each timezone
- Compact, card-based layout
- Pre-configured with major world cities
- Time converter modal with 5% wider layout for better usability

## Usage

1. **Enable/Disable Modules**: Edit `data/settings.js` and add module names to the `enabledModules` array
   ```javascript
   window.JINRASettings = {
     "enabledModules": ["example", "okr-tracker", "timer", "weekly-update", "world-time"],
     "enabledLibraries": []
   };
   ```

2. **Add Libraries**: Place JavaScript library files in `js/` and add their names (without .js) to `enabledLibraries` in settings.js

3. **Create Modules**: 
   - Create a new directory in `modules/`
   - Create a JavaScript file that exports a class or object
   - Optionally create a CSS file for module-specific styles
   - The module should have:
     - `constructor()` - Initialize module properties
     - `async init()` - Initialize the module (called on framework load)
     - `registerMenuButton()` or `registerMenuButtons()` - Register menu bar buttons
     - `open()` or `activate()` - Open/activate the module
     - `toggleMenuButtons(show)` - Show/hide module-specific menu buttons
   - See `modules/example/example.js` for a template

## Framework Features

- **Fully Offline**: Works completely offline with `file://` protocol
- **Modular Architecture**: Easy to add/remove modules via settings
- **Dynamic Loading**: Modules and libraries loaded on-demand
- **Menu System**: 
  - Module menu for switching between modules
  - Menu bar for module-specific actions
- **Persistent Storage**: Modules can use localStorage or File System Access API
- **No Build Process**: Pure HTML, CSS, and JavaScript - no compilation needed

## Running

Simply open `index.html` in a web browser. The framework will automatically load enabled modules and libraries based on `data/settings.js`. **No web server required** - it works completely offline with the `file://` protocol.

### Browser Compatibility

- **Chrome/Edge/Opera**: Full support including File System Access API
- **Firefox/Safari**: Works with localStorage (File System API not supported)
- **All Modern Browsers**: Core functionality works everywhere

## Module Development

Each module should follow this structure:

```javascript
class MyModule {
    constructor() {
        this.name = 'My Module';
        this.description = 'Module description';
    }

    async init() {
        // Initialize module
        this.registerMenuButtons();
    }

    registerMenuButtons() {
        // Register buttons in menu bar
    }

    open() {
        // Open/activate the module
        this.activate();
    }

    activate() {
        // Render module content
        const mainWindow = document.getElementById('modules-container');
        mainWindow.innerHTML = this.render();
        this.attachEventListeners();
        this.toggleMenuButtons(true);
    }

    toggleMenuButtons(show) {
        // Show/hide module-specific buttons
    }

    render() {
        // Return HTML string for module content
        return '<div>Module content</div>';
    }

    attachEventListeners() {
        // Attach event listeners to DOM elements
    }
}

// Export the module
window['my-module'] = MyModule;
```

## License

See LICENSE file for details.
