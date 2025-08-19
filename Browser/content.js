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
  // Check for selected text first
  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
    console.log('Using selected text for translation');
    const selectedChunks = getSelectedTextChunks(selection);
    if (selectedChunks.length > 0) {
      return selectedChunks;
    }
    console.log('Selected chunks empty, falling back to full page');
  }

  // If no selection or selection processing failed, get all text chunks
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

function getSelectedTextChunks(selection) {
  const chunks = [];
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    console.log('No selected text found, falling back to full page');
    return [];
  }
  
  try {
    const range = selection.getRangeAt(0);
    
    // Simple approach: create a single chunk from the entire selection
    if (selectedText.length > 0) {
      chunks.push({
        id: 0,
        text: selectedText,
        node: range.startContainer,
        parentPath: getElementPath(range.startContainer.parentElement || range.startContainer),
        originalText: selectedText,
        isSelected: true,
        selectionRange: range.cloneRange()
      });
    }
    
    // Also try the more complex approach as backup
    if (chunks.length === 0) {
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'meta', 'head'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue && node.nodeValue.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
        false
      );

      let node;
      let chunkId = 1;
      while (node = walker.nextNode()) {
        // Check if node is within selection
        const nodeRange = document.createRange();
        try {
          nodeRange.selectNode(node);
          if (range.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 &&
              range.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0) {
            
            let text = node.nodeValue || '';
            
            // Trim text to selection boundaries if needed
            if (node === range.startContainer) {
              text = text.substring(range.startOffset);
            }
            if (node === range.endContainer) {
              const endOffset = node === range.startContainer ? 
                range.endOffset - range.startOffset : range.endOffset;
              text = text.substring(0, endOffset);
            }
            
            text = text.trim();
            if (text.length > 0) {
              const parent = node.parentElement;
              chunks.push({
                id: chunkId++,
                text: text,
                node: node,
                parentPath: getElementPath(parent),
                originalText: text,
                isSelected: true,
                selectionRange: range.cloneRange()
              });
            }
          }
        } catch (e) {
          // Skip nodes that can't be selected
          continue;
        }
      }
    }
    
  } catch (e) {
    console.error('Error processing selected text chunks:', e);
    // Fallback: create a single chunk from the selection text
    if (selectedText.length > 0) {
      chunks.push({
        id: 0,
        text: selectedText,
        node: null, // No specific node
        parentPath: 'selection',
        originalText: selectedText,
        isSelected: true,
        selectionRange: null
      });
    }
  }
  
  console.log(`Found ${chunks.length} selected text chunks for translation`);
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
    if (chunk.translatedText) {
      try {
        // Handle selected text replacement
        if (chunk.isSelected && chunk.selectionRange) {
          try {
            // Try to replace the original selection
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const currentRange = selection.getRangeAt(0);
              const currentText = currentRange.toString();
              
              // If current selection matches our original text, replace it
              if (currentText === chunk.originalText || currentText.trim() === chunk.originalText.trim()) {
                currentRange.deleteContents();
                currentRange.insertNode(document.createTextNode(chunk.translatedText));
                replacedCount++;
                console.log(`Replaced selected text: "${chunk.originalText.substring(0, 50)}..." -> "${chunk.translatedText.substring(0, 50)}..."`);
                return;
              }
            }
            
            // Fallback: try to replace in the document
            if (chunk.selectionRange) {
              chunk.selectionRange.deleteContents();
              chunk.selectionRange.insertNode(document.createTextNode(chunk.translatedText));
              replacedCount++;
              console.log(`Replaced text using range: "${chunk.originalText.substring(0, 50)}..." -> "${chunk.translatedText.substring(0, 50)}..."`);
              return;
            }
          } catch (e) {
            console.warn('Selection replacement failed, trying node replacement:', e);
          }
        }
        
        // Regular node replacement for non-selected text
        if (chunk.node && chunk.node.parentElement) {
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
  } else if (msg?.type === "CHECK_SELECTION") {
    try {
      const selection = window.getSelection();
      const hasSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;
      sendResponse({ ok: true, hasSelection: hasSelection });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  }
  // true を返すと非同期応答を許可するが、ここは同期でOK
  return false;
});
