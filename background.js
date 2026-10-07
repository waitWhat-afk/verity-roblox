chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: false}).catch(console.error);

chrome.runtime.onInstalled.addListener(() => {
  const domains = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'grok.com'];
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2, 3, 4],
    addRules: domains.map((domain, index) => ({
      id: index + 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          {header: 'x-frame-options', operation: 'remove'},
          {header: 'content-security-policy', operation: 'remove'}
        ]
      },
      condition: {
        regexFilter: '^https://' + domain.replaceAll('.', '[.]') + '/',
        initiatorDomains: [chrome.runtime.id],
        resourceTypes: ['sub_frame']
      }
    }))
  }).catch(console.error);
});

async function toggleSidebar(tab) {
  if (!tab?.id) return;
  try {
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['overlay.js']});
    await chrome.action.setBadgeText({tabId: tab.id, text: ''});
  } catch (error) {
    console.warn('Custom sidebar is unavailable on this page:', error.message);
    await chrome.action.setBadgeText({tabId: tab.id, text: '!'}).catch(() => {});
    await chrome.action.setTitle({tabId: tab.id, title: 'Open a normal website to use the sidebar'}).catch(() => {});
  }
}
chrome.action.onClicked.addListener(toggleSidebar);
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({enabled: false}).catch(console.error);
});
