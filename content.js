// ページのテキストを取り出すヘルパ
function getVisibleText() {
  // 選択テキストがあれば優先
  const sel = window.getSelection && String(window.getSelection());
  if (sel && sel.trim().length > 0) return sel.trim();

  // PDFビューアなどは取得困難
  const isPdf = document.contentType && document.contentType.includes("pdf");
  if (isPdf) return "[PDFは直接テキスト抽出できない可能性があります]";

  // メインコンテンツのみ抽出（mainタグ優先）
  let text = "";
  const main = document.querySelector("main");
  if (main) {
    text = main.innerText;
  } else {
    text = document.body ? document.body.innerText : "";
  }
  // 余計な空白を軽く整理
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

// 要約/翻訳用にテキストを短く整形（トークン対策）
function takeHead(text, maxChars = 8000) {
  if (text.length <= maxChars) return text;
  // 頭+末尾でサンプリング
  const head = text.slice(0, Math.floor(maxChars * 0.7));
  const tail = text.slice(-Math.floor(maxChars * 0.3));
  return head + "\n...\n" + tail;
}

function getTextChunks() {
  const chunks = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    (node) => {
      // Skip script, style, and other non-visible elements
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tagName = parent.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'meta', 'head'].includes(tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      // Only include text nodes with meaningful content
      return node.nodeValue.trim().length > 3 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
    false
  );
  
  let node;
  let chunkId = 0;
  while (node = walker.nextNode()) {
    const text = node.nodeValue.trim();
    if (text) {
      // Create a unique identifier based on text content and parent element
      const parentPath = getElementPath(node.parentElement);
      chunks.push({
        id: chunkId++,
        text: text,
        node: node,
        parentPath: parentPath,
        originalText: text
      });
    }
  }
  
  console.log(`Found ${chunks.length} text chunks for translation`);
  return chunks;
}

function getElementPath(element) {
  const path = [];
  let current = element;
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += '#' + current.id;
    } else if (current.className) {
      selector += '.' + current.className.split(' ')[0];
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
}

function replaceTextChunks(translatedChunks) {
  let replacedCount = 0;
  translatedChunks.forEach(chunk => {
    if (chunk.node && chunk.node.parentElement && chunk.translatedText) {
      try {
        // Verify the node is still in the document and has the expected content
        if (document.contains(chunk.node) && chunk.node.nodeValue) {
          const originalContent = chunk.node.nodeValue.trim();
          if (originalContent === chunk.originalText || originalContent.includes(chunk.originalText)) {
            chunk.node.nodeValue = chunk.translatedText;
            replacedCount++;
            console.log(`Replaced text: "${chunk.originalText.substring(0, 50)}..." -> "${chunk.translatedText.substring(0, 50)}..."`);
          } else {
            console.warn(`Text content changed, skipping replacement for: ${chunk.originalText.substring(0, 50)}...`);
          }
        } else {
          console.warn(`Node no longer in document or empty, skipping replacement`);
        }
      } catch (e) {
        console.error('Error replacing text chunk:', e);
      }
    }
  });
  console.log(`Successfully replaced ${replacedCount} out of ${translatedChunks.length} text chunks`);
  return replacedCount;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "GET_PAGE_TEXT") {
    try {
      const raw = getVisibleText();
      const clipped = takeHead(raw);
      sendResponse({ ok: true, text: clipped });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  } else if (msg?.type === "GET_TEXT_CHUNKS") {
    try {
      const chunks = getTextChunks();
      // Send back chunks without the DOM nodes (can't serialize them)
      const serializableChunks = chunks.map(chunk => ({
        id: chunk.id,
        text: chunk.text
      }));
      sendResponse({ ok: true, chunks: serializableChunks });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  } else if (msg?.type === "REPLACE_TEXT_CHUNKS") {
    try {
      const { translatedChunks } = msg;
      if (!translatedChunks || !Array.isArray(translatedChunks)) {
        sendResponse({ ok: false, error: "Invalid translated chunks" });
        return;
      }
      
      // Get current chunks to match with translations
      const currentChunks = getTextChunks();
      console.log(`Current chunks: ${currentChunks.length}, Translated chunks: ${translatedChunks.length}`);
      console.log('Sample current chunk:', currentChunks[0]);
      console.log('Sample translated chunk:', translatedChunks[0]);
      
      const chunksToReplace = translatedChunks.map(tChunk => {
        // Try to match by ID first
        let matchingChunk = currentChunks.find(chunk => chunk.id === tChunk.id);
        
        // If ID match fails, try to match by text content
        if (!matchingChunk) {
          matchingChunk = currentChunks.find(chunk => 
            chunk.text === tChunk.text || chunk.originalText === tChunk.text
          );
        }
        
        if (matchingChunk) {
          return {
            ...matchingChunk,
            translatedText: tChunk.translatedText
          };
        } else {
          console.warn(`No matching chunk found for: ${tChunk.text?.substring(0, 50)}...`);
          return null;
        }
      }).filter(Boolean);
      
      console.log(`Chunks to replace: ${chunksToReplace.length}`);
      const actuallyReplaced = replaceTextChunks(chunksToReplace);
      sendResponse({ ok: true, replacedCount: actuallyReplaced });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  }
  // true を返すと非同期応答を許可するが、ここは同期でOK
  return false;
});
