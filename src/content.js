import './content.css'

let selectedText = '';
let isReadBuddyActive = false;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  if (selectedText && selectedText.length > 10) {
    showQuickActions();
  } else {
    hideQuickActions();
  }
});

// Quick action tooltip
function showQuickActions() {
  // Remove existing tooltip
  hideQuickActions();
  
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  const tooltip = document.createElement('div');
  tooltip.id = 'readbuddy-tooltip';
  tooltip.innerHTML = `
    <div class="readbuddy-actions">
      <button data-action="summarize" title="Summarize">📝</button>
      <button data-action="translate" title="Translate">🌐</button>
      <button data-action="explain" title="Explain">💡</button>
    </div>
  `;
  
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.top + window.scrollY - 50}px`;
  tooltip.style.zIndex = '10000';
  
  document.body.appendChild(tooltip);
  
  // Add click handlers
  tooltip.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const action = e.target.dataset.action;
      handleQuickAction(action, selectedText);
      hideQuickActions();
    }
  });
}

function hideQuickActions() {
  const existing = document.getElementById('readbuddy-tooltip');
  if (existing) {
    existing.remove();
  }
}

function handleQuickAction(action, text) {
  // Open side panel
  chrome.runtime.sendMessage({
    type: 'open-sidepanel',
    action: action,
    text: text
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action && message.text) {
    // Handle context menu actions
    handleQuickAction(message.action, message.text);
  }
});

// Page content extraction for summarization
function getPageContent() {
  // Try to find main content
  const selectors = [
    'article',
    '[role="main"]',
    '.content',
    '.post-content',
    '.entry-content',
    'main',
    '#content'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.innerText.trim();
    }
  }
  
  // Fallback to body text
  return document.body.innerText.trim();
}