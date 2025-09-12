
const measureBtn = document.getElementById('measureBtn');
const status = document.getElementById('status');

let measuring = false;

function isRestrictedUrl(url) {
  return !url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('chrome-extension://');
}

async function ensureContentScript(tab) {
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  } catch (e) {
    // ignore; page may be restricted
  }
}

async function sendOrInject(tab, message) {
  return new Promise(async (resolve) => {
    chrome.tabs.sendMessage(tab.id, message, async (resp) => {
      if (chrome.runtime.lastError || !resp) {
        await ensureContentScript(tab);
        chrome.tabs.sendMessage(tab.id, message, (resp2) => resolve(resp2));
      } else {
        resolve(resp);
      }
    });
  });
}

async function toggleMeasure() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (isRestrictedUrl(tab.url)) {
    status.textContent = 'Unsupported page';
    setTimeout(() => (status.textContent = ''), 1500);
    return;
  }

  measuring = !measuring;
  measureBtn.textContent = measuring ? 'Stop measuring' : 'Start measuring';

  const resp = await sendOrInject(tab, { type: measuring ? 'MEASURE_START' : 'MEASURE_STOP' });
  if (!resp) {
    status.textContent = 'Unable to communicate with page';
  } else if (resp.status) {
    status.textContent = resp.status;
  }
  setTimeout(() => (status.textContent = ''), 1500);
}

measureBtn.addEventListener('click', toggleMeasure);

chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
  if (!tab || isRestrictedUrl(tab.url)) return;
  const resp = await sendOrInject(tab, { type: 'MEASURE_STATUS' });
  if (resp && typeof resp.measuring === 'boolean') {
    measuring = resp.measuring;
    measureBtn.textContent = measuring ? 'Stop measuring' : 'Start measuring';
  }
});