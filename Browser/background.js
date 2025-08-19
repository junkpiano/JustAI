// --- 通知システム ---
async function showNotification(title, message, type = 'info') {
    try {
        // Try chrome notifications first
        const notificationId = await new Promise((resolve, reject) => {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: type === 'error' 
                    ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMTIuOTUgNCA0IDEyLjk1IDQgMjRTMTIuOTUgNDQgMjQgNDRTNDQgMzUuMDUgNDQgMjRTMzUuMDUgNCAyNCA0Wk0yNiAzNEgyMlYzMEgyNlYzNFpNMjYgMjJIMjJWMTRIMjZWMjJaIiBmaWxsPSIjRjQ0MzM2Ii8+Cjwvc3ZnPgo='
                    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMTIuOTUgNCA0IDEyLjk1IDQgMjRTMTIuOTUgNDQgMjQgNDRTNDQgMzUuMDUgNDQgMjRTMzUuMDUgNCAyNCA0Wk0yMCAzNEwxMCAyNEwxMi44MyAyMS4xN0wyMCAyOC4zNEwzNS4xNyAxMy4xN0wzOCAxNkwyMCAzNFoiIGZpbGw9IiM0Q0FGNTAKLZ48L3N2Zz4K',
                title: title,
                message: message
            }, (id) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(id);
                }
            });
        });
        
        console.log(`Notification created: ${title} - ${message}`);
        
        // Auto-clear notification after 5 seconds
        setTimeout(() => {
            chrome.notifications.clear(notificationId);
        }, 5000);
        
    } catch (error) {
        // Fallback: Log to console
        console.log(`NOTIFICATION: ${title} - ${message}`);
        
        // Try to show in action badge as fallback
        try {
            chrome.action.setBadgeText({ text: type === 'error' ? '!' : '✓' });
            chrome.action.setBadgeBackgroundColor({ color: type === 'error' ? '#FF0000' : '#00FF00' });
            
            // Clear badge after 3 seconds
            setTimeout(() => {
                chrome.action.setBadgeText({ text: '' });
            }, 3000);
        } catch (e) {
            console.error('All notification methods failed:', e);
        }
    }
}

// --- 結果保存システム ---
const backgroundResults = new Map();

// --- ローディングバッジシステム ---
let activeProcesses = new Set();

// --- タブ検証システム ---
async function isTabValid(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        return tab && tab.id === tabId && tab.url && !tab.url.startsWith('chrome://');
    } catch (error) {
        console.warn(`Tab ${tabId} no longer exists or is not accessible`);
        return false;
    }
}

async function validateTabBeforeProcessing(tabId, processName) {
    const isValid = await isTabValid(tabId);
    if (!isValid) {
        throw new Error(`Tab ${tabId} is no longer valid for ${processName}`);
    }
    console.log(`Tab ${tabId} validated for ${processName}`);
    return true;
}

async function showLoadingBadge(processId) {
    activeProcesses.add(processId);
    try {
        await chrome.action.setBadgeText({ text: '⏳' });
        await chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });
        console.log(`Loading badge shown for process: ${processId}`);
    } catch (e) {
        console.error('Failed to show loading badge:', e);
    }
}

async function hideLoadingBadge(processId) {
    activeProcesses.delete(processId);
    
    // Only hide badge if no other processes are running
    if (activeProcesses.size === 0) {
        try {
            await chrome.action.setBadgeText({ text: '' });
            console.log(`Loading badge hidden for process: ${processId}`);
        } catch (e) {
            console.error('Failed to hide loading badge:', e);
        }
    } else {
        console.log(`Other processes still running (${activeProcesses.size}), keeping badge`);
    }
}

function saveResult(tabId, type, result) {
    const key = `${tabId}_${type}`;
    backgroundResults.set(key, {
        timestamp: Date.now(),
        result: result,
        type: type,
        tabId: tabId,
        viewed: false
    });
    
    console.log(`Result saved: ${type} for tab ${tabId}`);
    
    // Clean up old results (older than 30 minutes)
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [k, v] of backgroundResults.entries()) {
        if (v.timestamp < cutoff) {
            backgroundResults.delete(k);
        }
    }
}

function getResult(tabId, type) {
    const key = `${tabId}_${type}`;
    return backgroundResults.get(key);
}

// --- 設定のロード ---
async function loadConfig() {
    return new Promise(res => chrome.storage.sync.get(
        {
            apiKey: "",
            model: "gpt-4o-mini",
            targetLang: "ja",
            apiEndpoint: ""
        },
        res
    ));
}

// --- OpenAI API 呼び出し ---
async function callOpenAI({ apiKey, model, system, messages, apiEndpoint }) {
    // Validate inputs
    if (!apiKey || apiKey.trim().length === 0) {
        throw new Error("API key is required");
    }
    if (!model || model.trim().length === 0) {
        throw new Error("Model is required");
    }
    if (!messages || messages.length === 0) {
        throw new Error("Messages are required");
    }

    const body = {
        model: model.trim(),
        messages: [
            ...(system ? [{ role: "system", content: system }] : []),
            ...messages
        ],
        temperature: 0.2
    };
    
    const endpoint = apiEndpoint && apiEndpoint.trim().length > 0
        ? apiEndpoint.trim()
        : "https://api.openai.com/v1/chat/completions";
    
    console.log(`Making API call to: ${endpoint}`);
    console.log(`Model: ${model}, Messages: ${messages.length}`);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const resp = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "User-Agent": "Chrome-Extension"
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log(`API response status: ${resp.status}`);

        if (!resp.ok) {
            let errorText = "";
            try {
                errorText = await resp.text();
                console.error(`API error response: ${errorText}`);
            } catch (textError) {
                console.error("Failed to read error response:", textError);
            }
            
            // Provide more specific error messages
            if (resp.status === 401) {
                throw new Error("Invalid API key. Please check your OpenAI API key in settings.");
            } else if (resp.status === 429) {
                throw new Error("API rate limit exceeded. Please try again later.");
            } else if (resp.status === 500) {
                throw new Error("OpenAI server error. Please try again later.");
            } else {
                throw new Error(`API error ${resp.status}: ${errorText || 'Unknown error'}`);
            }
        }

        const data = await resp.json();
        console.log("API call successful");
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error("No response from API");
        }
        
        const content = data.choices[0]?.message?.content ?? "";
        if (!content) {
            throw new Error("Empty response from API");
        }
        
        return content.trim();
    } catch (error) {
        console.error("API call error:", error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            throw new Error("Request timeout: API call took too long. Please try again.");
        } else if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
            throw new Error("Network error: Unable to connect to OpenAI API. Check internet connection, firewall, or try a different API endpoint.");
        } else if (error.message.includes('CORS')) {
            throw new Error("CORS error: API endpoint may not support browser requests. Try using the official OpenAI API endpoint.");
        }
        
        // Re-throw other errors as-is
        throw error;
    }
}

// --- タブのテキストチャンクを取得 ---
async function getTabTextChunks(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: "GET_TEXT_CHUNKS" }, (resp) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (!resp?.ok) {
                reject(new Error(resp?.error || "Unknown content script error"));
            } else {
                resolve(resp.chunks);
            }
        });
    });
}

// --- タブからテキスト取得 ---
async function getTabText(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: "GET_PAGE_TEXT" }, (resp) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (!resp?.ok) {
                reject(new Error(resp?.error || "Unknown content script error"));
            } else {
                resolve(resp.text);
            }
        });
    });
}

// --- タブのテキストチャンクを置換 ---
async function replaceTabTextChunks(tabId, translatedChunks) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { 
            type: "REPLACE_TEXT_CHUNKS", 
            translatedChunks
        }, (resp) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (!resp?.ok) {
                reject(new Error(resp?.error || "Unknown content script error"));
            } else {
                resolve(resp);
            }
        });
    });
}

// --- バックグラウンド翻訳処理 ---
async function performBackgroundTranslation(tabId) {
    const processId = `translate_${tabId}`;
    
    try {
        await showLoadingBadge(processId);
        
        // Validate tab before starting processing
        await validateTabBeforeProcessing(tabId, 'translation');
        
        const config = await loadConfig();
        const { apiKey, model, targetLang, apiEndpoint } = config;
        
        if (!apiKey) {
            throw new Error("API key not configured");
        }

        // Get text chunks from the tab
        const chunks = await getTabTextChunks(tabId);
        if (!chunks || chunks.length === 0) {
            throw new Error("No text chunks found");
        }

        // Use larger batches to reduce API calls and avoid rate limits
        const optimalBatchSize = Math.min(chunks.length, 25);
        const translatedChunks = [];
        
        // Process batches sequentially with delay to respect rate limits
        for (let i = 0; i < chunks.length; i += optimalBatchSize) {
            const batch = chunks.slice(i, i + optimalBatchSize);
            const textsToTranslate = batch.map(chunk => chunk.text).join('\n---CHUNK_SEPARATOR---\n');
            
            try {
                const translatedBatch = await callOpenAI({
                    apiKey, model, apiEndpoint,
                    system: `Translate to ${targetLang}. Keep same chunk count, separated by '---CHUNK_SEPARATOR---'.`,
                    messages: [
                        { role: "user", content: textsToTranslate }
                    ]
                });
                
                const translatedTexts = translatedBatch.split('---CHUNK_SEPARATOR---');
                
                // Match translated texts back to chunks
                for (let j = 0; j < batch.length && j < translatedTexts.length; j++) {
                    translatedChunks.push({
                        id: batch[j].id,
                        text: batch[j].text,
                        translatedText: translatedTexts[j].trim()
                    });
                }
                
                // Add delay between batches to respect rate limits (only if more batches remain)
                if (i + optimalBatchSize < chunks.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
                }
                
            } catch (error) {
                if (error.message.includes('rate limit') || error.message.includes('429')) {
                    // Exponential backoff for rate limit errors
                    console.warn('Rate limit hit, waiting before retry...');
                    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second wait
                    i -= optimalBatchSize; // Retry the same batch
                    continue;
                }
                throw error; // Re-throw other errors
            }
        }

        // Validate tab is still valid before replacement
        await validateTabBeforeProcessing(tabId, 'text replacement');

        // Replace text chunks in the webpage
        await replaceTabTextChunks(tabId, translatedChunks);
        
        // Show notification when complete
        await showNotification('Translation Complete', `Translation completed (${translatedChunks.length} chunks replaced)`, 'success');
        
        return { success: true, replacedCount: translatedChunks.length };
    } catch (error) {
        // Show error notification
        await showNotification('Translation Error', `Translation failed: ${error.message}`, 'error');
        
        throw error;
    } finally {
        await hideLoadingBadge(processId);
    }
}

// --- バックグラウンド要約処理 ---
async function performBackgroundSummarize(tabId) {
    const processId = `summarize_${tabId}`;
    
    try {
        await showLoadingBadge(processId);
        
        // Validate tab before starting processing
        await validateTabBeforeProcessing(tabId, 'summarization');
        
        const config = await loadConfig();
        const { apiKey, model, targetLang, apiEndpoint } = config;
        
        if (!apiKey) {
            throw new Error("API key not configured");
        }

        // Get text from the tab
        const text = await getTabText(tabId);
        if (!text || text.length < 2) {
            throw new Error("No text found for summarization");
        }

        const summary = await callOpenAI({
            apiKey, model, apiEndpoint,
            system: `You are a concise assistant. Summarize web pages in ${targetLang} using bullet points.`,
            messages: [
                { role: "user", content: `以下のテキストを、重要項目5〜8点で${targetLang}の箇条書き要約にしてください。必要ならキーテイクアウェイも最後に1行:\n\n${text}` }
            ]
        });

        // Save result for popup to retrieve
        saveResult(tabId, 'summarize', summary);
        
        // Show notification with summary
        const summaryPreview = summary.substring(0, 200) + (summary.length > 200 ? '...' : '');
        await showNotification('Summary Complete', summaryPreview, 'success');
        
        return { success: true, summary };
    } catch (error) {
        await showNotification('Summary Error', `Summary failed: ${error.message}`, 'error');
        
        throw error;
    } finally {
        await hideLoadingBadge(processId);
    }
}

// --- バックグラウンド文章生成処理 ---
async function performBackgroundGenerate(tabId, prompt) {
    const processId = `generate_${tabId}`;
    
    try {
        await showLoadingBadge(processId);
        
        // Validate tab before starting processing
        await validateTabBeforeProcessing(tabId, 'text generation');
        
        const config = await loadConfig();
        const { apiKey, model, targetLang, apiEndpoint } = config;
        
        if (!apiKey) {
            throw new Error("API key not configured");
        }

        // Get page text for context
        let pageText = "";
        try {
            pageText = await getTabText(tabId);
        } catch (e) {
            // Continue without page context if failed
            console.warn("Failed to get page context:", e.message);
        }

        const generatedText = await callOpenAI({
            apiKey, model, apiEndpoint,
            system: `You write clear, helpful text for ${targetLang} readers. Use the following page context to inform your writing.`,
            messages: [
                { role: "user", content: `【ページの内容】\n${pageText}\n\n【要件】\n${prompt}\n\n上記のページ内容を参考に、${targetLang}で文章を作成。必要なら簡潔な見出しと段落構成にする。` }
            ]
        });

        // Save result for popup to retrieve  
        saveResult(tabId, 'generate', generatedText);
        
        // Show notification with generated text
        const textPreview = generatedText.substring(0, 200) + (generatedText.length > 200 ? '...' : '');
        await showNotification('Text Generation Complete', textPreview, 'success');
        
        return { success: true, generatedText };
    } catch (error) {
        await showNotification('Generation Error', `Text generation failed: ${error.message}`, 'error');
        
        throw error;
    } finally {
        await hideLoadingBadge(processId);
    }
}

// --- メッセージ処理 ---
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "START_BACKGROUND_TRANSLATION") {
        const { tabId } = message;
        
        // Start translation in background (don't wait for completion)
        performBackgroundTranslation(tabId).catch(console.error);
        
        // Respond immediately
        sendResponse({ success: true, message: "Translation started in background" });
        return true; // Keep message channel open for async response
    } else if (message.type === "START_BACKGROUND_SUMMARIZE") {
        const { tabId } = message;
        
        // Start summarization in background (don't wait for completion)
        performBackgroundSummarize(tabId).catch(console.error);
        
        // Respond immediately
        sendResponse({ success: true, message: "Summarization started in background" });
        return true;
    } else if (message.type === "START_BACKGROUND_GENERATE") {
        const { tabId, prompt } = message;
        
        if (!prompt || prompt.trim().length === 0) {
            sendResponse({ success: false, error: "Prompt is required" });
            return;
        }
        
        // Start text generation in background (don't wait for completion)
        performBackgroundGenerate(tabId, prompt.trim()).catch(console.error);
        
        // Respond immediately
        sendResponse({ success: true, message: "Text generation started in background" });
        return true;
    } else if (message.type === "GET_BACKGROUND_RESULT") {
        const { tabId, resultType } = message;
        const result = getResult(tabId, resultType);
        
        if (result) {
            // Mark as viewed but don't delete yet
            result.viewed = true;
            sendResponse({ 
                success: true, 
                result: result.result, 
                timestamp: result.timestamp,
                isNew: !result.viewed 
            });
        } else {
            sendResponse({ success: false, error: "No result found" });
        }
        return true;
    } else if (message.type === "CHECK_RECENT_RESULTS") {
        const { tabId } = message;
        const recentResults = [];
        
        // Find recent results (within 10 minutes)
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const [, value] of backgroundResults.entries()) {
            if (value.tabId === tabId && value.timestamp > cutoff) {
                recentResults.push({
                    type: value.type,
                    timestamp: value.timestamp,
                    viewed: value.viewed,
                    preview: value.result.substring(0, 100) + (value.result.length > 100 ? '...' : '')
                });
            }
        }
        
        sendResponse({ success: true, results: recentResults });
        return true;
    } else if (message.type === "TEST_API_CONNECTION") {
        // Manual API test trigger
        testAPIConnection().then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
});

// Tab monitoring for cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
    // Clean up any active processes for closed tabs
    const processesToRemove = [];
    for (const processId of activeProcesses) {
        if (processId.includes(`_${tabId}`)) {
            processesToRemove.push(processId);
        }
    }
    
    processesToRemove.forEach(processId => {
        activeProcesses.delete(processId);
        console.log(`Cleaned up process ${processId} for closed tab ${tabId}`);
    });
    
    // Clean up stored results for closed tab
    for (const [key, value] of backgroundResults.entries()) {
        if (value.tabId === tabId) {
            backgroundResults.delete(key);
            console.log(`Cleaned up stored result for closed tab ${tabId}`);
        }
    }
    
    // Hide badge if no processes are left
    if (activeProcesses.size === 0) {
        chrome.action.setBadgeText({ text: '' }).catch(() => {});
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    // Clean up processes if tab navigated to a new URL
    if (changeInfo.url) {
        const processesToRemove = [];
        for (const processId of activeProcesses) {
            if (processId.includes(`_${tabId}`)) {
                processesToRemove.push(processId);
            }
        }
        
        if (processesToRemove.length > 0) {
            processesToRemove.forEach(processId => {
                activeProcesses.delete(processId);
                console.log(`Cleaned up process ${processId} for navigated tab ${tabId}`);
            });
            
            // Hide badge if no processes are left
            if (activeProcesses.size === 0) {
                chrome.action.setBadgeText({ text: '' }).catch(() => {});
            }
        }
    }
});

// Test function to debug network issues
async function testAPIConnection() {
    try {
        console.log("Testing API connection...");
        const config = await loadConfig();
        
        if (!config.apiKey) {
            console.error("No API key configured");
            return;
        }
        
        const testEndpoint = config.apiEndpoint || "https://api.openai.com/v1/chat/completions";
        console.log("Testing endpoint:", testEndpoint);
        
        const response = await callOpenAI({
            apiKey: config.apiKey,
            model: config.model || "gpt-4o-mini",
            messages: [{ role: "user", content: "Hello" }]
        });
        
        console.log("API test successful:", response);
    } catch (error) {
        console.error("API test failed:", error);
    }
}

// --- Context Menu Setup ---
function createContextMenus() {
    // Remove existing context menus first
    chrome.contextMenus.removeAll(() => {
        // Create context menus for selected text
        chrome.contextMenus.create({
            id: "ai-tools-separator",
            type: "separator",
            contexts: ["selection"]
        });
        
        chrome.contextMenus.create({
            id: "ai-tools-parent",
            title: "🤖 AI Tools",
            contexts: ["selection"]
        });
        
        chrome.contextMenus.create({
            id: "summarize-selection",
            parentId: "ai-tools-parent",
            title: "📄 要約 (Summarize)",
            contexts: ["selection"]
        });
        
        chrome.contextMenus.create({
            id: "translate-selection", 
            parentId: "ai-tools-parent",
            title: "🌐 翻訳 (Translate)",
            contexts: ["selection"]
        });
        
        chrome.contextMenus.create({
            id: "generate-selection",
            parentId: "ai-tools-parent", 
            title: "✨ 文章生成 (Generate)",
            contexts: ["selection"]
        });
        
        // Add separator for page-level actions
        chrome.contextMenus.create({
            id: "ai-tools-page-separator",
            type: "separator",
            contexts: ["page"]
        });
        
        chrome.contextMenus.create({
            id: "ai-tools-page-parent",
            title: "🤖 AI Tools (Page)",
            contexts: ["page"]
        });
        
        chrome.contextMenus.create({
            id: "summarize-page",
            parentId: "ai-tools-page-parent",
            title: "📄 ページを要約",
            contexts: ["page"]
        });
        
        chrome.contextMenus.create({
            id: "translate-page",
            parentId: "ai-tools-page-parent", 
            title: "🌐 ページを翻訳",
            contexts: ["page"]
        });
        
        console.log("Context menus created");
    });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;
    
    console.log(`Context menu clicked: ${info.menuItemId}`);
    
    try {
        switch (info.menuItemId) {
            case "summarize-selection":
            case "summarize-page":
                await performBackgroundSummarize(tab.id);
                break;
                
            case "translate-selection":
            case "translate-page":
                await performBackgroundTranslation(tab.id);
                break;
                
            case "generate-selection":
                // For generation, we need a prompt - show notification to use the popup
                await showNotification(
                    'Text Generation', 
                    'Please use the extension popup to enter a prompt for text generation.', 
                    'info'
                );
                break;
        }
    } catch (error) {
        console.error('Context menu action failed:', error);
        await showNotification('Error', `Action failed: ${error.message}`, 'error');
    }
});

// Extension initialization
chrome.runtime.onInstalled.addListener(async () => {
    await showNotification('Mini AI Tools', 'Extension ready for use', 'info');
    
    // Create context menus
    createContextMenus();
    
    // Test API connection on install
    setTimeout(testAPIConnection, 2000);
});