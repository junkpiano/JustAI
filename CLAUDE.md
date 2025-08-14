# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chrome browser extension called "Mini AI Tools" (Mini AI ツール) that provides summarization, translation, and text generation capabilities for web pages using the OpenAI API. The extension is designed to be simple and focused on three core AI functions.

## Architecture

The extension follows the standard Chrome extension architecture with Manifest V3:

- **manifest.json**: Extension configuration with permissions for storage, activeTab, scripting, and host access
- **popup.html/popup.js/popup.css**: Main UI popup interface with settings dialog
- **content.js**: Content script that extracts and manipulates text on web pages

### Key Components

1. **Text Extraction System** (`content.js`):
   - `getVisibleText()`: Extracts visible text from pages, prioritizing selected text
   - `getTextChunks()`: Creates granular text chunks for translation
   - `replaceTextChunks()`: Replaces text chunks in-place for page translation

2. **API Integration** (`popup.js`):
   - `callOpenAI()`: Handles OpenAI API calls with configurable endpoints
   - Supports custom API endpoints and models
   - Batch processing for translation to handle API limits

3. **Multi-language Support**:
   - UI localization for Japanese, English, and Chinese
   - Dynamic language detection based on user settings
   - Translation target language configuration

### Data Flow

1. User clicks function button in popup
2. Content script extracts text from active tab
3. Text is sent to OpenAI API with appropriate system prompts
4. For translation: text chunks are processed in batches and replaced in-place
5. Results displayed in popup or applied to page

## Configuration

Settings are stored in Chrome's sync storage:
- `apiKey`: OpenAI API key (stored unencrypted)
- `model`: OpenAI model (default: gpt-4o-mini)
- `targetLang`: Target language for translations (default: ja)
- `apiEndpoint`: Custom API endpoint (optional)

## Development

This is a client-side only extension with no build process. All files are served directly:

- Load the extension in Chrome by enabling Developer Mode and loading the unpacked extension
- No package.json, build scripts, or test framework present
- Direct file editing and Chrome extension reload for development

## Security Considerations

The extension requests broad permissions (`<all_urls>`) and stores API keys without encryption in browser storage. This is noted in the UI with appropriate warnings to users.