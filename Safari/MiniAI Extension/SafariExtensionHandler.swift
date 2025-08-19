import SafariServices
import Foundation

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    // Storage for API keys and settings (equivalent to Chrome storage)
    private let userDefaults = UserDefaults.standard
    
    // Background result storage (equivalent to Chrome background.js results)
    private var backgroundResults: [String: [String: Any]] = [:]
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        page.getPropertiesWithCompletionHandler { properties in
            guard let url = properties?.url else { return }
            NSLog("Received message \(messageName) from \(url)")
            
            // Handle different message types (equivalent to Chrome background.js message handling)
            switch messageName {
            case "getStorage":
                self.handleGetStorage(page: page, keys: userInfo?["keys"] as? [String] ?? [])
            case "setStorage":
                self.handleSetStorage(items: userInfo?["items"] as? [String: Any] ?? [:])
            case "contentScript":
                self.handleContentScriptMessage(page: page, userInfo: userInfo)
            case "startBackgroundSummarize":
                self.handleBackgroundSummarize(page: page)
            case "startBackgroundTranslate":
                self.handleBackgroundTranslate(page: page)
            case "startBackgroundGenerate":
                self.handleBackgroundGenerate(page: page, prompt: userInfo?["prompt"] as? String ?? "")
            default:
                break
            }
        }
    }
    
    override func toolbarItemClicked(in window: SFSafariWindow) {
        window.getActiveTab { activeTab in
            activeTab?.getActivePage { activePage in
                activePage?.dispatchMessageToScript(withName: "togglePopup", userInfo: nil)
            }
        }
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        validationHandler(true, "")
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }
    
    // MARK: - Storage Management (equivalent to Chrome storage API)
    
    private func handleGetStorage(page: SFSafariPage, keys: [String]) {
        var result: [String: Any] = [:]
        
        // Default values
        let defaults: [String: Any] = [
            "apiKey": "",
            "model": "gpt-4o-mini",
            "targetLang": "ja",
            "apiEndpoint": ""
        ]
        
        for key in keys.isEmpty ? Array(defaults.keys) : keys {
            result[key] = userDefaults.object(forKey: key) ?? defaults[key] ?? ""
        }
        
        page.dispatchMessageToScript(withName: "storageResponse", userInfo: result)
    }
    
    private func handleSetStorage(items: [String: Any]) {
        for (key, value) in items {
            userDefaults.set(value, forKey: key)
        }
        userDefaults.synchronize()
    }
    
    // MARK: - Content Script Communication
    
    private func handleContentScriptMessage(page: SFSafariPage, userInfo: [String: Any]?) {
        guard let messageType = userInfo?["type"] as? String else { return }
        
        switch messageType {
        case "GET_PAGE_TEXT":
            // Forward to content script
            page.dispatchMessageToScript(withName: "GET_PAGE_TEXT", userInfo: nil)
        case "CHECK_SELECTION":
            // Forward to content script  
            page.dispatchMessageToScript(withName: "CHECK_SELECTION", userInfo: nil)
        default:
            break
        }
    }
    
    // MARK: - Background Processing (equivalent to Chrome background.js functions)
    
    private func handleBackgroundSummarize(page: SFSafariPage) {
        // Get page text first
        page.dispatchMessageToScript(withName: "GET_PAGE_TEXT", userInfo: nil)
        
        // In a real implementation, you would:
        // 1. Get the page text from content script response
        // 2. Load config from userDefaults  
        // 3. Make API call to OpenAI
        // 4. Store result and show notification
        
        // For now, send a simple response
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            page.dispatchMessageToScript(withName: "response", userInfo: [
                "ok": true,
                "result": "Summary processing started in background"
            ])
        }
    }
    
    private func handleBackgroundTranslate(page: SFSafariPage) {
        // Similar to summarize but for translation
        page.dispatchMessageToScript(withName: "GET_PAGE_TEXT", userInfo: nil)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            page.dispatchMessageToScript(withName: "response", userInfo: [
                "ok": true, 
                "result": "Translation processing started in background"
            ])
        }
    }
    
    private func handleBackgroundGenerate(page: SFSafariPage, prompt: String) {
        // Generate text with given prompt
        page.dispatchMessageToScript(withName: "GET_PAGE_TEXT", userInfo: nil)
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            page.dispatchMessageToScript(withName: "response", userInfo: [
                "ok": true,
                "result": "Text generation with prompt '\(prompt)' started in background"
            ])
        }
    }
    
    // MARK: - API Calling (equivalent to Chrome background.js callOpenAI)
    
    private func callOpenAI(apiKey: String, model: String, messages: [[String: String]], completion: @escaping (Result<String, Error>) -> Void) {
        guard let url = URL(string: "https://api.openai.com/v1/chat/completions") else {
            completion(.failure(NSError(domain: "InvalidURL", code: 0, userInfo: nil)))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Safari-Extension", forHTTPHeaderField: "User-Agent")
        
        let body: [String: Any] = [
            "model": model,
            "messages": messages,
            "temperature": 0.2
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "NoData", code: 0, userInfo: nil)))
                return
            }
            
            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let choices = json["choices"] as? [[String: Any]],
                   let firstChoice = choices.first,
                   let message = firstChoice["message"] as? [String: Any],
                   let content = message["content"] as? String {
                    completion(.success(content))
                } else {
                    completion(.failure(NSError(domain: "InvalidResponse", code: 0, userInfo: nil)))
                }
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}