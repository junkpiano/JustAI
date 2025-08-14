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

function getUILang(targetLang) {
    if (["ja", "en", "zh"].includes(targetLang)) return targetLang;
    const nav = navigator.language.slice(0, 2);
    if (["ja", "en", "zh"].includes(nav)) return nav;
    return "ja";
}

// --- 設定のロード/保存 ---
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
async function saveConfig({ apiKey, model, targetLang, apiEndpoint }) {
    return new Promise(res => chrome.storage.sync.set({ apiKey, model, targetLang, apiEndpoint }, res));
}

// --- UI ユーティリティ ---
function $(q) { return document.querySelector(q); }
function setResult(text) {
    $("#result").textContent = text;
}

// --- バックグラウンド結果チェック ---
let resultCheckInterval = null;

async function checkForBackgroundResult(tabId, resultType) {
    try {
        const response = await chrome.runtime.sendMessage({
            type: "GET_BACKGROUND_RESULT",
            tabId: tabId,
            resultType: resultType
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        const response = await chrome.runtime.sendMessage({
            type: "CHECK_RECENT_RESULTS",
            tabId: tab.id
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
                const fullResponse = await chrome.runtime.sendMessage({
                    type: "GET_BACKGROUND_RESULT",
                    tabId: tab.id,
                    resultType: latestResult.type
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

    // Check for recent results when popup opens
    await checkForRecentResults();

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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            setResult("アクティブなタブが見つかりません。");
            return;
        }

        try {
            // Start background summarization
            const response = await chrome.runtime.sendMessage({
                type: "START_BACKGROUND_SUMMARIZE",
                tabId: tab.id
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            setResult("アクティブなタブが見つかりません。");
            return;
        }

        try {
            // Start background translation
            const response = await chrome.runtime.sendMessage({
                type: "START_BACKGROUND_TRANSLATION",
                tabId: tab.id
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            setResult("アクティブなタブが見つかりません。");
            return;
        }

        try {
            // Start background text generation
            const response = await chrome.runtime.sendMessage({
                type: "START_BACKGROUND_GENERATE",
                tabId: tab.id,
                prompt: prompt
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
