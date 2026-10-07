chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true}).catch(console.error);

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
