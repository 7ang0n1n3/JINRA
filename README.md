# JINRA
Command and control web app framework

A fully offline, modular framework built with HTML, CSS, and JavaScript. Functions and features can be added or removed via a settings file.

## Structure

- **`data/`** - Settings and configuration files
  - `settings.js` - Main settings file that controls which modules and libraries are enabled (JavaScript format for offline compatibility)
- **`js/`** - JavaScript libraries (external dependencies)
- **`modules/`** - Standalone plugin modules
  - Each module should be in its own directory with a `.js` file
  - Example: `modules/example/example.js`
- **`styles/`** - CSS stylesheets for the main framework

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
