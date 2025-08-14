# Just AI Tools

A simple Chrome extension for AI-powered text processing with OpenAI integration. Provides summarization, translation with webpage replacement, and text generation features.

## Features

- **📝 Summarize**: Generate bullet-point summaries of webpage content
- **🌐 Translate**: Translate and replace webpage text in real-time
- **✍️ Generate**: Create custom text using page content as context
- **⚡ Background Processing**: All operations run in background with notifications
- **🔄 Result Persistence**: Results saved even if you close the popup
- **🎯 Smart Text Replacement**: Intelligent DOM-based text replacement for translations

## Installation (Developer Mode)

Since this extension is not yet published to the Chrome Web Store, you'll need to install it in Developer Mode:

### Prerequisites
- Google Chrome browser
- OpenAI API key

### Steps

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd justai
   ```

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle on **Developer mode** (top-right corner)

3. **Load the Extension**
   - Click **Load unpacked**
   - Select the `justai` folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Just AI Tools" and click the pin icon
   - The extension icon will appear in your toolbar

## Setup

1. **Get an OpenAI API Key**
   - Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure the Extension**
   - Click the Mini AI Tools icon in Chrome toolbar
   - Click the ⚙️ settings button
   - Enter your OpenAI API key
   - (Optional) Customize model and target language
   - Click **Save**

## Usage

### Basic Operations
1. **Navigate to any webpage** with text content
2. **Click the extension icon** to open the popup
3. **Choose an action**:
   - **要約/Summarize**: Creates bullet-point summary
   - **翻訳/Translate**: Translates and replaces page text
   - **文章生成/Generate**: Creates custom text with page context

### Background Processing
- All operations run in the background
- You can close the popup while processing continues
- Loading indicator (⏳) appears on extension icon
- Browser notifications show when complete
- Results persist and appear when you reopen the popup

### Translation Feature
- Intelligently replaces text in webpage DOM
- Preserves page structure and formatting
- Processes text in chunks for better accuracy
- Works with dynamic content

### Text Generation
- Enter a custom prompt in the generate area
- Uses current page content as context
- Supports multiple languages
- Perfect for creating summaries, responses, or analysis

## Supported Languages

The extension supports multiple UI languages and translation targets:
- Japanese (ja)
- English (en)
- Chinese (zh)
- Korean (ko)
- Spanish (es)
- French (fr)
- German (de)
- Russian (ru)

## Configuration Options

### Settings Panel
- **API Endpoint**: Custom OpenAI-compatible endpoint (optional)
- **API Key**: Your OpenAI API key (required)
- **Model**: AI model to use (default: gpt-4o-mini)
- **Language**: Base language and translation target

### Advanced Features
- **Batch Processing**: Efficiently handles large pages
- **Smart Caching**: Results cached for 30 minutes
- **Error Handling**: Comprehensive error messages
- **Tab Validation**: Prevents processing closed/invalid tabs

## Troubleshooting

### Common Issues

**"API key is required" Error**
- Ensure you've entered a valid OpenAI API key in settings
- Check that the key starts with `sk-`

**"Failed to fetch" Error**
- Check internet connection
- Verify firewall/proxy settings aren't blocking OpenAI API
- Try using a different network

**Translation Not Working**
- Check browser console for detailed error messages
- Ensure page has loaded completely before translating
- Try refreshing the page and translating again

**No Results Appearing**
- Results are saved in background - try reopening the popup
- Check for browser notifications
- Look for loading indicator (⏳) on extension icon

### Debug Mode
1. Open Chrome DevTools (F12)
2. Check Console tab for detailed logs
3. Look for messages starting with "NOTIFICATION:" or API call logs

## Privacy & Security

- API key stored locally in Chrome extension storage (unencrypted)
- No data sent to external servers except OpenAI API calls
- Page content only processed locally and sent to configured AI endpoint
- No telemetry or tracking

## File Structure

```
justai/
├── manifest.json     # Extension manifest
├── popup.html        # Extension popup UI
├── popup.css         # Popup styling
├── popup.js          # Popup logic and UI handling
├── background.js     # Background processing and API calls
├── content.js        # Page content extraction and replacement
└── README.md         # This file
```

## Contributing

This extension is in active development. Key areas for contribution:
- Additional language support
- UI/UX improvements
- Performance optimizations
- Error handling enhancements

## License

[Add your license here]