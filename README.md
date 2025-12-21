# JINRA
Command Center web app framework

A fully offline, modular framework built with HTML, CSS, and JavaScript. Functions and features can be added or removed via a settings file.

## Structure

- **`data/`** - Settings and configuration files
  - `settings.js` - Main settings file that controls which modules and libraries are enabled (JavaScript format for offline compatibility)
- **`js/`** - JavaScript libraries (external dependencies)
- **`modules/`** - Standalone plugin modules
  - Each module should be in its own directory with a `.js` file
  - Example: `modules/example/example.js`
- **`styles/`** - CSS stylesheets for the main framework

## Available Modules

### Example (`example`)
A template module demonstrating basic module structure and functionality. Useful as a starting point for creating new modules.

### OKR Tracker (`okr-tracker`)
Track Objectives and Key Results (OKRs) with:
- Create and manage objectives with weights
- Add key results to objectives with auto-balancing weights
- Status tracking (On Track / Off Track / At Risk) with color-coded indicators
- Progress tracking with visual progress bars
- Date tracking (Created, Start Date, Target Date, Last Check-in)
- Export reports to text files
- Save/load data using File System Access API or localStorage

### Timer (`timer`)
Multiple timer and countdown functionality:
- Create unlimited timers (stopwatch style)
- Create unlimited countdown timers with HH:MM:SS format
- Start/stop/reset controls for each timer
- Visual feedback (blinking) when countdown reaches zero
- Persistent timers that continue running when switching modules
- Add custom names to timers and countdowns
- Delete individual timers/countdowns

### Weekly Update (`weekly-update`)
Create and export weekly updates in a structured text format:
- Multiple sections with date and region
- Multiple entries per section with county, process, title, and content
- Tab-based interface for sections and entries
- Auto-save to browser storage
- Export to formatted text files with proper alignment
- Reset form functionality

### World Time (`world-time`)
Display current time in multiple time zones:
- Real-time clock updates
- Shows date, time, and UTC offset for each timezone
- Compact, card-based layout
- Pre-configured with major world cities

## Usage

1. **Enable/Disable Modules**: Edit `data/settings.js` and add module names to the `enabledModules` array
   ```javascript
   window.JINRASettings = {
     "enabledModules": ["example"],
     "enabledLibraries": []
   };
   ```

2. **Add Libraries**: Place JavaScript library files in `js/` and add their names (without .js) to `enabledLibraries` in settings.js

3. **Create Modules**: 
   - Create a new directory in `modules/`
   - Create a JavaScript file that exports a class or object
   - The module should have an `init()` method and optionally a `render()` method
   - See `modules/example/example.js` for a template

## Running

Simply open `index.html` in a web browser. The framework will automatically load enabled modules and libraries based on `data/settings.js`. **No web server required** - it works completely offline with the `file://` protocol.
