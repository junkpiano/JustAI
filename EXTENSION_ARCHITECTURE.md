# Extension Architecture: Chrome vs Safari

## Shared Resources

The following files are shared between Chrome and Safari extensions via symbolic links:

- **popup.html** - UI markup (identical for both platforms)
- **popup.css** - UI styling (identical for both platforms)  
- **popup.js** - Main popup logic (works with both Chrome and Safari APIs)
- **content.js** - Content script for page interaction

## Platform-Specific Differences

### Chrome Extension
```
Chrome Extension/
├── manifest.json          # Chrome extension manifest
├── background.js          # Service worker for background processing
├── popup.html            # Shared UI
├── popup.css             # Shared styling  
├── popup.js              # Shared logic (uses Chrome APIs)
└── content.js            # Shared content script
```

**Background Processing**: Chrome uses `background.js` as a service worker that:
- Handles API calls to OpenAI
- Manages notifications
- Stores results in memory
- Processes long-running tasks

### Safari Extension  
```
Safari Extension/
├── MiniAI.xcodeproj/     # Xcode project
├── MiniAI/               # Host app wrapper
│   ├── AppDelegate.swift
│   ├── ViewController.swift
│   └── Info.plist
└── MiniAI Extension/     # Safari extension
    ├── SafariExtensionHandler.swift    # Background processing logic
    ├── SafariExtensionViewController.swift
    ├── Info.plist        # Safari extension manifest
    └── Resources/        # Symbolic links to shared files
        ├── popup.html -> ../../../Browser/popup.html
        ├── popup.css -> ../../../Browser/popup.css
        ├── popup.js -> ../../../Browser/popup.js
        └── content.js -> ../../../Browser/content.js
```

**Background Processing**: Safari uses `SafariExtensionHandler.swift` which:
- Implements the same logic as `background.js` in Swift
- Handles storage via UserDefaults (equivalent to Chrome storage)
- Manages API calls using URLSession
- Processes messages from popup and content scripts

## Key Architectural Differences

| Aspect | Chrome | Safari |
|--------|--------|---------|
| **Background Logic** | `background.js` (JavaScript) | `SafariExtensionHandler.swift` (Swift) |
| **Storage** | `chrome.storage.sync` | `UserDefaults` |
| **Messaging** | `chrome.runtime.sendMessage` | `safari.extension.dispatchMessage` |
| **API Calls** | Fetch API in background script | URLSession in Swift |
| **Notifications** | `chrome.notifications` | Native macOS notifications |
| **Permissions** | manifest.json | Info.plist |
| **Distribution** | Chrome Web Store | Mac App Store (requires host app) |

## Benefits of This Architecture

1. **Code Reuse**: UI files (HTML/CSS/JS) are shared via symbolic links
2. **Single Source of Truth**: Changes to shared files affect both extensions
3. **Platform Optimization**: Background logic is optimized for each platform
4. **Maintainability**: Core functionality is shared, platform differences are isolated

## Development Workflow

1. **Shared Changes**: Modify the root files (popup.html, popup.css, popup.js, content.js)
2. **Chrome-Specific**: Modify background.js or manifest.json  
3. **Safari-Specific**: Modify SafariExtensionHandler.swift or Info.plist
4. **Both**: Build and test on both platforms

This approach maximizes code reuse while respecting the unique requirements of each platform.