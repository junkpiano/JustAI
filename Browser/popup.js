const TEXT = {
    ja: {
        title: "Mini AI Tools",
        headerTitle: "Mini AI",
        summarize: "要約",
        translate: "翻訳",
        generate: "文章生成",
        labelGenPrompt: "プロンプト",
        runGenerate: "作成",
        settingsTitle: "設定",
        labelApiEndpoint: "APIエンドポイント",
        labelApiKey: "OpenAI API Key",
        labelModel: "モデル名",
        labelTargetLang: "言語",
        save: "保存",
        close: "閉じる",
        noteStorage: "※キーはブラウザの拡張ストレージに暗号化なしで保存されます。自己責任でご利用ください。",
        summarize_running: lang => `要約を${lang}で作成しています…`,
        translate_running: lang => `${lang}に翻訳してページを置換しています…`,
        translate_complete: "ページの翻訳と置換が完了しました。",
        genPromptPlaceholder: "例: 採用候補者への丁寧なお礼メールを300文字で",
        genLangPlaceholder: "ja / en など",
        gen_getting_page: "ページの内容を取得しています…",
        gen_generating: "文章を生成しています…",
        translate_background_started: "翻訳をバックグラウンドで開始しました。完了時に通知が表示されます。ポップアップを閉じても処理は続行されます。",
        translate_start_failed: "翻訳の開始に失敗しました:",
        summarize_background_started: "要約をバックグラウンドで開始しました。完了時に通知が表示されます。ポップアップを閉じても処理は続行されます。",
        summarize_start_failed: "要約の開始に失敗しました:",
        generate_background_started: "文章生成をバックグラウンドで開始しました。完了時に通知が表示されます。ポップアップを閉じても処理は続行されます。",
        generate_start_failed: "文章生成の開始に失敗しました:"
    },
    en: {
        title: "Mini AI Tools",
        headerTitle: "Mini AI",
        summarize: "Summarize",
        translate: "Translate",
        generate: "Generate Text",
        labelGenPrompt: "Prompt",
        runGenerate: "Generate",
        settingsTitle: "Settings",
        labelApiEndpoint: "API Endpoint",
        labelApiKey: "OpenAI API Key",
        labelModel: "Model Name",
        labelTargetLang: "Language",
        save: "Save",
        close: "Close",
        noteStorage: "※API key is stored in browser extension storage without encryption. Use at your own risk.",
        summarize_running: lang => `Summarizing in ${lang}…`,
        translate_running: lang => `Translating to ${lang} and replacing page content…`,
        translate_complete: "Page translation and replacement completed.",
        genPromptPlaceholder: "e.g., Write a polite thank-you email to job candidates in 300 words",
        genLangPlaceholder: "ja / en etc.",
        gen_getting_page: "Getting page content…",
        gen_generating: "Generating text…",
        translate_background_started: "Translation started in background. You'll be notified when complete. You can close the popup - the process will continue.",
        translate_start_failed: "Failed to start translation:",
        summarize_background_started: "Summarization started in background. You'll be notified when complete. You can close the popup - the process will continue.",
        summarize_start_failed: "Failed to start summarization:",
        generate_background_started: "Text generation started in background. You'll be notified when complete. You can close the popup - the process will continue.",
        generate_start_failed: "Failed to start text generation:"
    },
    zh: {
        title: "Mini AI工具",
        headerTitle: "Mini AI",
        summarize: "摘要",
        translate: "翻译",
        generate: "生成文本",
        labelGenPrompt: "提示词",
        runGenerate: "生成",
        settingsTitle: "设置",
        labelApiEndpoint: "API端点",
        labelApiKey: "OpenAI API密钥",
        labelModel: "模型名称",
        labelTargetLang: "语言",
        save: "保存",
        close: "关闭",
        noteStorage: "※密钥将以未加密方式存储在浏览器扩展存储中。请自行承担风险。",
        summarize_running: lang => `正在用${lang}生成摘要…`,
        translate_running: lang => `正在翻译为${lang}并替换页面内容…`,
        translate_complete: "页面翻译和替换已完成。",
        genPromptPlaceholder: "例：为求职者写一封300字的礼貌感谢邮件",
        genLangPlaceholder: "zh / en 等",
        gen_getting_page: "正在获取页面内容…",
        gen_generating: "正在生成文章…",
        translate_background_started: "翻译已在后台开始。完成时将收到通知。您可以关闭弹窗 - 进程将继续运行。",
        translate_start_failed: "启动翻译失败：",
        summarize_background_started: "摘要已在后台开始。完成时将收到通知。您可以关闭弹窗 - 进程将继续运行。",
        summarize_start_failed: "启动摘要失败：",
        generate_background_started: "文章生成已在后台开始。完成时将收到通知。您可以关闭弹窗 - 进程将继续运行。",
        generate_start_failed: "启动文章生成失败："
    }
};

// Browser API abstraction layer
const BrowserAPI = {
    isChrome: typeof chrome !== 'undefined' && chrome.storage && chrome.tabs,
    isSafari: typeof safari !== 'undefined' && safari.extension,

    // Storage API abstraction
    storage: {
        get: function(keys, callback) {
            if (BrowserAPI.isChrome) {
                chrome.storage.sync.get(keys, callback);
            } else if (BrowserAPI.isSafari) {
                safari.extension.dispatchMessage("getStorage", { keys: Object.keys(keys) });
                // Safari response will be handled via message listener
            }
        },
        set: function(items, callback) {
            if (BrowserAPI.isChrome) {
                chrome.storage.sync.set(items, callback);
            } else if (BrowserAPI.isSafari) {
                safari.extension.dispatchMessage("setStorage", { items: items });
                if (callback) callback();
            }
        }
    },

    // Tabs API abstraction
    tabs: {
        query: function(queryInfo, callback) {
            if (BrowserAPI.isChrome) {
                chrome.tabs.query(queryInfo, callback);
            } else if (BrowserAPI.isSafari) {
                // Safari doesn't have direct tab querying, assume current active tab
                callback([{ id: 'current' }]);
            }
        },
        sendMessage: function(tabId, message, callback) {
            if (BrowserAPI.isChrome) {
                chrome.tabs.sendMessage(tabId, message, callback);
            } else if (BrowserAPI.isSafari) {
                safari.extension.dispatchMessage("contentScript", message);
                // Safari response handling would need to be set up via message listeners
            }
        }
    },

    // Runtime API abstraction
    runtime: {
        sendMessage: function(message, callback) {
            if (BrowserAPI.isChrome) {
                chrome.runtime.sendMessage(message, callback);
            } else if (BrowserAPI.isSafari) {
                const messageType = message.type;
                if (messageType === "START_BACKGROUND_SUMMARIZE") {
                    safari.extension.dispatchMessage("startBackgroundSummarize", message);
                } else if (messageType === "START_BACKGROUND_TRANSLATION") {
                    safari.extension.dispatchMessage("startBackgroundTranslate", message);
                } else if (messageType === "START_BACKGROUND_GENERATE") {
                    safari.extension.dispatchMessage("startBackgroundGenerate", message);
                }
                // For Safari, we'll need to handle responses via message listeners
                if (callback) {
                    setTimeout(() => callback({ success: true }), 100);
                }
            }
        },
        get lastError() {
            if (BrowserAPI.isChrome) {
                return chrome.runtime.lastError;
            }
            return null;
        }
    }
};

// Safari message listener setup
if (BrowserAPI.isSafari) {
    safari.extension.addEventListener("message", function(event) {
        const messageName = event.name;
        const userInfo = event.message;
        
        if (messageName === "storageResponse") {
            // Handle storage response
            if (window._storageCallback) {
                window._storageCallback(userInfo);
                window._storageCallback = null;
            }
        } else if (messageName === "response") {
            // Handle other responses
            if (window._responseCallback) {
                window._responseCallback(userInfo);
                window._responseCallback = null;
            }
        }
    }, false);
}

function getUILang(targetLang) {
    if (["ja", "en", "zh"].includes(targetLang)) return targetLang;
    const nav = navigator.language.slice(0, 2);
    if (["ja", "en", "zh"].includes(nav)) return nav;
    return "ja";
}

// --- 設定のロード/保存 ---
async function loadConfig() {
    return new Promise(res => {
        const defaults = {
            apiKey: "",
            model: "gpt-4o-mini",
            targetLang: "ja",
            apiEndpoint: ""
        };
        
        if (BrowserAPI.isSafari) {
            window._storageCallback = res;
            BrowserAPI.storage.get(defaults);
        } else {
            BrowserAPI.storage.get(defaults, res);
        }
    });
}
async function saveConfig({ apiKey, model, targetLang, apiEndpoint }) {
    return new Promise(res => {
        BrowserAPI.storage.set({ apiKey, model, targetLang, apiEndpoint }, res);
    });
}

// --- UI ユーティリティ ---
function $(q) { return document.querySelector(q); }

// --- Markdown to HTML converter ---
function markdownToHtml(text) {
    if (!text) return '';
    
    let html = text
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br>');
    
    return html;
}

// --- Check if text contains markdown ---
function isMarkdown(text) {
    if (!text) return false;
    
    const markdownPatterns = [
        /^#+\s/m,           // Headers
        /\*\*.*?\*\*/,      // Bold
        /__.*?__/,          // Bold alternative
        /\*.*?\*/,          // Italic
        /_.*?_/,            // Italic alternative
        /`.*?`/,            // Inline code
        /```[\s\S]*?```/,   // Code blocks
        /\[.*?\]\(.*?\)/    // Links
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
}

function setResult(text) {
    const resultEl = $("#result");
    
    if (isMarkdown(text)) {
        resultEl.innerHTML = markdownToHtml(text);
    } else {
        resultEl.textContent = text;
    }
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
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
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

// --- コンテンツスクリプト通信 ---
async function getTabText(tabId) {
    return new Promise((resolve, reject) => {
        const callback = (resp) => {
            if (BrowserAPI.runtime.lastError) {
                reject(new Error(BrowserAPI.runtime.lastError.message));
            } else if (!resp?.ok) {
                reject(new Error(resp?.error || "Unknown content script error"));
            } else {
                resolve(resp.text);
            }
        };
        
        if (BrowserAPI.isSafari) {
            window._responseCallback = callback;
        }
        
        BrowserAPI.tabs.sendMessage(tabId, { type: "GET_PAGE_TEXT" }, callback);
    });
}

async function getTabTextChunks(tabId) {
    return new Promise((resolve, reject) => {
        const callback = (resp) => {
            if (BrowserAPI.runtime.lastError) {
                reject(new Error(BrowserAPI.runtime.lastError.message));
            } else if (!resp?.ok) {
                reject(new Error(resp?.error || "Unknown content script error"));
            } else {
                resolve(resp.chunks);
            }
        };
        
        if (BrowserAPI.isSafari) {
            window._responseCallback = callback;
        }
        
        BrowserAPI.tabs.sendMessage(tabId, { type: "GET_TEXT_CHUNKS" }, callback);
    });
}

async function replaceTabTextChunks(tabId, translatedChunks) {
    return new Promise((resolve, reject) => {
        const callback = (resp) => {
            if (BrowserAPI.runtime.lastError) {
                reject(new Error(BrowserAPI.runtime.lastError.message));
            } else if (!resp?.ok) {
                reject(new Error(resp?.error || "Unknown content script error"));
            } else {
                resolve(resp);
            }
        };
        
        if (BrowserAPI.isSafari) {
            window._responseCallback = callback;
        }
        
        BrowserAPI.tabs.sendMessage(tabId, { 
            type: "REPLACE_TEXT_CHUNKS", 
            translatedChunks
        }, callback);
    });
}

// --- Test API Connection (Certificate Recognition) ---
async function testAPIConnection() {
    const { apiKey, model, apiEndpoint } = await loadConfig();
    
    if (!apiKey) {
        setResult("❌ No API key configured. Please set up your OpenAI API key in settings.");
        return false;
    }
    
    setResult("🔗 Initializing...");
    
    try {
        // Simple test call to establish certificate trust
        await callOpenAI({
            apiKey,
            model: model || "gpt-4o-mini", 
            apiEndpoint,
            messages: [{ role: "user", content: "Hello" }]
        });
        
        setResult("✅ Ready! Choose a function above to get started.");
        console.log("Certificate established, background processing should now work");
        return true;
    } catch (error) {
        setResult(`❌ Connection failed: ${error.message}\n\nPlease check your API key and internet connection in settings.`);
        console.error("API connection test failed:", error);
        return false;
    }
}

// --- バックグラウンド結果チェック ---
let resultCheckInterval = null;

async function checkForBackgroundResult(tabId, resultType) {
    try {
        const response = await new Promise((resolve) => {
            BrowserAPI.runtime.sendMessage({
                type: "GET_BACKGROUND_RESULT",
                tabId: tabId,
                resultType: resultType
            }, resolve);
        });

        if (response.success && response.result) {
            setResult(response.result);
            clearResultCheck();
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error checking background result:", e);
        return false;
    }
}

function startResultCheck(tabId, resultType) {
    clearResultCheck();
    resultCheckInterval = setInterval(async () => {
        const found = await checkForBackgroundResult(tabId, resultType);
        if (found) {
            clearResultCheck();
        }
    }, 2000); // Check every 2 seconds

    // Stop checking after 5 minutes
    setTimeout(() => {
        clearResultCheck();
    }, 5 * 60 * 1000);
}

function clearResultCheck() {
    if (resultCheckInterval) {
        clearInterval(resultCheckInterval);
        resultCheckInterval = null;
    }
}

// --- 結果チェック ---
async function checkForRecentResults() {
    try {
        const [tab] = await new Promise((resolve) => {
            BrowserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        if (!tab?.id) return;

        const response = await new Promise((resolve) => {
            BrowserAPI.runtime.sendMessage({
                type: "CHECK_RECENT_RESULTS",
                tabId: tab.id
            }, resolve);
        });

        if (response.success && response.results.length > 0) {
            // Show the most recent unviewed result
            const unviewedResults = response.results.filter(r => !r.viewed);
            const latestResult = unviewedResults.length > 0 
                ? unviewedResults.sort((a, b) => b.timestamp - a.timestamp)[0]
                : response.results.sort((a, b) => b.timestamp - a.timestamp)[0];

            if (latestResult) {
                const age = Math.floor((Date.now() - latestResult.timestamp) / 1000 / 60);
                const ageText = age < 1 ? "just now" : `${age} min ago`;
                
                // Get the full result
                const fullResponse = await new Promise((resolve) => {
                    BrowserAPI.runtime.sendMessage({
                        type: "GET_BACKGROUND_RESULT",
                        tabId: tab.id,
                        resultType: latestResult.type
                    }, resolve);
                });

                if (fullResponse.success) {
                    setResult(`📋 ${latestResult.type} (${ageText}):\n\n${fullResponse.result}`);
                }
            }
        }
    } catch (e) {
        console.error("Error checking recent results:", e);
    }
}

// --- Check for selected text ---
async function checkSelectedText() {
    try {
        const [tab] = await new Promise((resolve) => {
            BrowserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        if (!tab?.id) return false;

        const response = await new Promise((resolve) => {
            BrowserAPI.tabs.sendMessage(tab.id, { type: "CHECK_SELECTION" }, resolve);
        });
        return response?.hasSelection || false;
    } catch (e) {
        console.log("Could not check selection:", e.message);
        return false;
    }
}

// --- Update selection status display ---
async function updateSelectionStatus() {
    const hasSelection = await checkSelectedText();
    const selectionStatus = $("#selection-status");
    
    if (hasSelection) {
        selectionStatus.classList.remove("hidden");
    } else {
        selectionStatus.classList.add("hidden");
    }
}

// --- Initial result display ---
async function initializeResult() {
    // Test API connection on popup open to establish certificate trust
    const connected = await testAPIConnection();
    if (connected) {
        // Check for recent results from background processing
        await checkForRecentResults();
    }
    
    // Update selection status
    await updateSelectionStatus();
}

// --- 初期化 ---
document.addEventListener("DOMContentLoaded", async () => {
    const cfg = await loadConfig();
    const uiLang = getUILang(cfg.targetLang);

    // UIローカライズ
    document.title = TEXT[uiLang].title;
    $("#title").textContent = TEXT[uiLang].title;
    $("#header-title").textContent = TEXT[uiLang].headerTitle;
    $("#summarize").textContent = TEXT[uiLang].summarize;
    $("#translate").textContent = TEXT[uiLang].translate;
    $("#generate").textContent = TEXT[uiLang].generate;
    $("#label-gen-prompt").textContent = TEXT[uiLang].labelGenPrompt;
    $("#run-generate").textContent = TEXT[uiLang].runGenerate;
    $("#settings-title").textContent = TEXT[uiLang].settingsTitle;
    $("#label-api-endpoint").textContent = TEXT[uiLang].labelApiEndpoint;
    $("#label-api-key").textContent = TEXT[uiLang].labelApiKey;
    $("#label-model").textContent = TEXT[uiLang].labelModel;
    $("#label-target-lang").textContent = TEXT[uiLang].labelTargetLang;
    $("#save").textContent = TEXT[uiLang].save;
    $("#close-settings").textContent = TEXT[uiLang].close;
    $("#note-storage").textContent = TEXT[uiLang].noteStorage;

    // Set placeholder text
    $("#gen-prompt").placeholder = TEXT[uiLang].genPromptPlaceholder;

    $("#api-endpoint").value = cfg.apiEndpoint || "";
    $("#api-key").value = cfg.apiKey;
    $("#model").value = cfg.model;
    $("#target-lang").value = cfg.targetLang;

    // Initialize result display
    await initializeResult();

    // 設定ダイアログ
    const dialog = $("#settings");
    $("#open-settings").addEventListener("click", () => dialog.showModal());
    $("#close-settings").addEventListener("click", () => dialog.close());
    $("#save").addEventListener("click", async () => {
        await saveConfig({
            apiKey: $("#api-key").value.trim(),
            model: $("#model").value.trim() || "gpt-4o-mini",
            targetLang: $("#target-lang").value || "ja",
            apiEndpoint: $("#api-endpoint").value.trim()
        });
        dialog.close();
    });

    // 文章生成パネルの表示切替
    $("#generate").addEventListener("click", () => {
        $("#generate-area").classList.toggle("hidden");
    });

    // --- 要約 ---
    $("#summarize").addEventListener("click", async () => {
        const { apiKey, targetLang } = await loadConfig();
        const uiLang = getUILang(targetLang);
        if (!apiKey) { 
            setResult("まず設定からAPI Keyを保存してください。"); 
            return; 
        }

        // Get current active tab
        const [tab] = await new Promise((resolve) => {
            BrowserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        if (!tab?.id) {
            setResult("アクティブなタブが見つかりません。");
            return;
        }

        try {
            // Start background summarization
            const response = await new Promise((resolve) => {
                BrowserAPI.runtime.sendMessage({
                    type: "START_BACKGROUND_SUMMARIZE",
                    tabId: tab.id
                }, resolve);
            });

            if (response.success) {
                setResult(TEXT[uiLang].summarize_background_started);
                // Start checking for results
                startResultCheck(tab.id, 'summarize');
            } else {
                setResult(TEXT[uiLang].summarize_start_failed + " " + (response.error || "Unknown error"));
            }
        } catch (e) {
            setResult("要約エラー: " + e.message);
        }
    });

    // --- 翻訳 ---
    $("#translate").addEventListener("click", async () => {
        const { apiKey, targetLang } = await loadConfig();
        const uiLang = getUILang(targetLang);
        if (!apiKey) { 
            setResult("まず設定からAPI Keyを保存してください。"); 
            return; 
        }

        // Get current active tab
        const [tab] = await new Promise((resolve) => {
            BrowserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        if (!tab?.id) {
            setResult("アクティブなタブが見つかりません。");
            return;
        }

        try {
            // Start background translation
            const response = await new Promise((resolve) => {
                BrowserAPI.runtime.sendMessage({
                    type: "START_BACKGROUND_TRANSLATION",
                    tabId: tab.id
                }, resolve);
            });

            if (response.success) {
                setResult(TEXT[uiLang].translate_background_started);
            } else {
                setResult(TEXT[uiLang].translate_start_failed + " " + (response.error || "Unknown error"));
            }
        } catch (e) {
            setResult("翻訳エラー: " + e.message);
        }
    });

    // --- 文章生成 ---
    $("#run-generate").addEventListener("click", async () => {
        const { apiKey, targetLang } = await loadConfig();
        const uiLang = getUILang(targetLang);
        if (!apiKey) { 
            setResult("まず設定からAPI Keyを保存してください。"); 
            return; 
        }

        const prompt = $("#gen-prompt").value.trim();
        if (!prompt) { 
            setResult("プロンプトを入力してください。"); 
            return; 
        }

        // Get current active tab
        const [tab] = await new Promise((resolve) => {
            BrowserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
        });
        if (!tab?.id) {
            setResult("アクティブなタブが見つかりません。");
            return;
        }

        try {
            // Start background text generation
            const response = await new Promise((resolve) => {
                BrowserAPI.runtime.sendMessage({
                    type: "START_BACKGROUND_GENERATE",
                    tabId: tab.id,
                    prompt: prompt
                }, resolve);
            });

            if (response.success) {
                setResult(TEXT[uiLang].generate_background_started);
                // Start checking for results
                startResultCheck(tab.id, 'generate');
            } else {
                setResult(TEXT[uiLang].generate_start_failed + " " + (response.error || "Unknown error"));
            }
        } catch (e) {
            setResult("生成エラー: " + e.message);
        }
    });
});
