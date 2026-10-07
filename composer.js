(() => {
  const extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
  if (window === window.top) return;
  const completed = new Map();
  function findEditor() {
    const selectors = {
      'chatgpt.com': ['#prompt-textarea', 'textarea[data-id="root"]', '[contenteditable="true"][role="textbox"]'],
      'claude.ai': ['[contenteditable="true"].ProseMirror', '[contenteditable="true"][role="textbox"]', 'textarea'],
      'gemini.google.com': ['rich-textarea [contenteditable="true"]', '[contenteditable="true"][role="textbox"]'],
      'grok.com': ['textarea[placeholder]', '[contenteditable="true"][role="textbox"]', '[contenteditable="true"].ProseMirror']
    };
    for (const selector of selectors[location.hostname] || []) {
      for (const el of document.querySelectorAll(selector)) {
        if (!el.getClientRects().length || el.disabled || el.readOnly || el.closest('[aria-disabled="true"]')) continue;
        if (el.tagName === 'TEXTAREA' || el.isContentEditable) return el;
      }
    }
    return null;
  }
  function insertURL(editor, url) {
    editor.focus();
    if (editor.tagName === 'TEXTAREA') {
      const current = editor.value;
      const next = current + (current && !/\s$/.test(current) ? '\n' : '') + url;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(editor, next);
      editor.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: url}));
      editor.setSelectionRange(next.length, next.length);
      return editor.value.includes(url);
    }
    const current = editor.innerText || editor.textContent || '';
    const text = (current.trim() && !/\s$/.test(current) ? '\n' : '') + url;
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('insertText', false, text);
    return (editor.innerText || editor.textContent || '').includes(url);
  }
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== extensionOrigin) return;
    const message = event.data;
    if (!message || message.type !== 'verity:paste-url' || typeof message.id !== 'string' || message.id.length > 100) return;
    if (typeof message.url !== 'string' || message.url.length > 32768) return;
    try { if (!['https:', 'http:'].includes(new URL(message.url).protocol)) return; } catch { return; }
    const reply = result => window.parent.postMessage({type: 'verity:paste-result', id: message.id, ...result}, extensionOrigin);
    if (completed.has(message.id)) { reply(completed.get(message.id)); return; }
    const editor = findEditor();
    if (!editor) { reply({ok: false, retry: true, error: 'Open a chat and wait for its message box to load.'}); return; }
    let result;
    try {
      result = insertURL(editor, message.url)
        ? {ok: true}
        : {ok: false, error: 'This message box could not accept the link. Paste it manually.'};
    } catch { result = {ok: false, error: 'Could not insert the link into this message box.'}; }
    completed.set(message.id, result);
    if (completed.size > 30) completed.delete(completed.keys().next().value);
    reply(result);
  });
})();
