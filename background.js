
chrome.runtime.onInstalled.addListener(() => {
  console.log('Simple Action Helper installed');
});

// Example: respond to messages from popup/content
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STORE') {
    chrome.storage.local.get(['exampleKey'], (res) => sendResponse(res));
    return true; // keep channel open for async response
  }

  if (msg.type === 'SET_STORE') {
    chrome.storage.local.set({ exampleKey: msg.value }, () => sendResponse({ ok: true }));
    return true;
  }
});