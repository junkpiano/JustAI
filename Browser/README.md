# Browser Extension Files

This directory contains the shared browser extension files that work across both Chrome and Safari.

## Files

- **manifest.json** - Chrome extension manifest (Manifest V3)
- **popup.html** - Extension popup interface HTML
- **popup.css** - Extension popup styling
- **popup.js** - Main popup logic with cross-browser compatibility
- **content.js** - Content script for text extraction and manipulation
- **background.js** - Background service worker (Chrome only)

## Cross-Browser Compatibility

The extension supports both Chrome and Safari through a browser abstraction layer in `popup.js`:

### Chrome Support
- Uses native Chrome extension APIs (`chrome.*`)
- Full Manifest V3 compatibility
- Background service worker for processing

### Safari Support  
- Uses Safari extension messaging (`safari.extension.dispatchMessage`)
- Communicates with Swift SafariExtensionHandler
- Storage via UserDefaults in the native app

## Usage

### Chrome
Load the Browser directory as an unpacked extension in Chrome Developer Mode.

### Safari
The Safari extension in `/Safari/` directory uses symbolic links to these shared files, ensuring both extensions stay in sync.

## Browser Detection

The `BrowserAPI` object in `popup.js` automatically detects the browser environment and provides a unified interface for:
- Storage operations
- Tab communication  
- Runtime messaging
- Error handling