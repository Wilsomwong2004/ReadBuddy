import './content.css'

let selectedText = '';
let isEnabled = true;
let isTooltipVisible = false;
let isDarkMode = false;
let extensionContextValid = true;
let scrollTimeout = null;
let isScrolling = false;
let pendingSelection = null;

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Check if extension context is valid
function isExtensionContextValid() {
  try {
    const valid = chrome.runtime && chrome.runtime.id;
    extensionContextValid = valid;
    
    if (!valid && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      console.log('[Content] Extension context invalid, attempting reconnection...');
      reconnectAttempts++;
      setTimeout(() => {
        // Try to reinitialize
        if (chrome.runtime && chrome.runtime.id) {
          console.log('[Content] Reconnection successful!');
          extensionContextValid = true;
          reconnectAttempts = 0;
          initializeExtension();
        }
      }, 500);
    }
    
    return valid;
  } catch (e) {
    extensionContextValid = false;
    return false;
  }
}

async function ensureContentScriptReady() {
  if (!isExtensionContextValid()) {
    console.log('[Content] Extension context lost, requesting page reload hint...');
    showExtensionReloadNotification();
    return false;
  }
  return true;
}

// Safe chrome.runtime.sendMessage with context check
function safeSendMessage(message, callback) {
  if (!isExtensionContextValid()) {
    console.warn('[Content] Extension context invalidated. Please refresh the page.');
    showExtensionReloadNotification();
    return false;
  }
  
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Content] Runtime error:', chrome.runtime.lastError.message);
        if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
          showExtensionReloadNotification();
        }
      } else if (callback) {
        callback(response);
      }
    });
    return true;
  } catch (error) {
    console.error('[Content] Error sending message:', error);
    showExtensionReloadNotification();
    return false;
  }
}

// Show notification to refresh page
function showExtensionReloadNotification() {
  // Only show once
  if (document.getElementById('readbuddy-reload-notification')) {
    return;
  }
  
  const notification = document.createElement('div');
  notification.id = 'readbuddy-reload-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 2px solid #ef4444;
      color: #991b1b;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    ">
      <div style="font-weight: 600; margin-bottom: 4px;">⚠️ ReadBuddy Updated</div>
      <div style="font-size: 13px; margin-bottom: 8px;">Please refresh this page to use the latest version.</div>
      <button onclick="location.reload()" style="
        background: #ef4444;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">
        Refresh Now
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: transparent;
        color: #991b1b;
        border: 1px solid #991b1b;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        margin-left: 8px;
      ">
        Dismiss
      </button>
    </div>
  `;
  document.body.appendChild(notification);
}

// Initialize extension state
function initializeExtension() {
  if (!isExtensionContextValid()) {
    console.log('[Content] Extension context invalid during initialization');
    return;
  }

  chrome.storage.local.get("isEnabled", (data) => {
    if (chrome.runtime.lastError) {
      console.warn('[Content] Error getting isEnabled:', chrome.runtime.lastError);
      return;
    }
    isEnabled = data.isEnabled !== false;
    console.log('[Content] Extension enabled:', isEnabled);
  });

  chrome.storage.local.get("darkMode", (data) => {
    if (chrome.runtime.lastError) {
      console.warn('[Content] Error getting darkMode:', chrome.runtime.lastError);
      return;
    }
    isDarkMode = data.darkMode === true;
    console.log('[Content] Dark mode:', isDarkMode);
  });
}

// Initial setup
initializeExtension();

// Re-initialize when page becomes visible (tab switching)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('[Content] Tab became visible, reinitializing...');
    
    // Small delay to ensure extension context is ready
    setTimeout(() => {
      initializeExtension();
    }, 100);
  }
});

// Re-initialize on focus (additional safety)
window.addEventListener('focus', () => {
  console.log('[Content] Window focused, checking extension state...');
  
  setTimeout(() => {
    if (isExtensionContextValid()) {
      initializeExtension();
    }
  }, 50);
});

if (isExtensionContextValid()) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.isEnabled) {
      isEnabled = changes.isEnabled.newValue;
      console.log('[Content] Extension enabled changed to:', isEnabled);
      if (!isEnabled) {
        hideQuickActions();
      }
    }
    
    if (namespace === "local" && changes.darkMode) {
      isDarkMode = changes.darkMode.newValue;
      console.log('[Content] Dark mode changed to:', isDarkMode);
      // Update tooltip if visible
      const tooltip = document.getElementById('readbuddy-tooltip');
      if (tooltip) {
        if (isDarkMode) {
          tooltip.classList.add('dark');
        } else {
          tooltip.classList.remove('dark');
        }
      }
    }
  });

  // Listen for dark mode changes from other parts of extension
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'darkModeChanged') {
      isDarkMode = message.darkMode;
      console.log('[Content] Dark mode changed via message:', isDarkMode);
      const tooltip = document.getElementById('readbuddy-tooltip');
      if (tooltip) {
        if (isDarkMode) {
          tooltip.classList.add('dark');
        } else {
          tooltip.classList.remove('dark');
        }
      }
    }
  });
}

document.addEventListener('mouseup', async (e) => {
  if (!await ensureContentScriptReady()) {
    return;
  }

  const tooltip = document.getElementById('readbuddy-tooltip');
  if (tooltip && tooltip.contains(e.target)) {
    console.log('[Content] Click on tooltip, ignoring mouseup');
    return;
  }

  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  console.log('[Content] Text selected, length:', selectedText.length);
  
  if (selectedText && selectedText.length > 10) {
    console.log('[Content] Showing tooltip for text:', selectedText.substring(0, 50) + '...');
    
    // If currently scrolling, save selection for later
    if (isScrolling) {
      pendingSelection = {
        text: selectedText,
        selection: selection,
        range: selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      };
      console.log('[Content] Scrolling detected, tooltip will show after scroll stops');
    } else {
      showQuickActions(selectedText);
    }
  } else {
    console.log('[Content] Text too short, hiding tooltip');
    hideQuickActions();
    pendingSelection = null;
  }
});

// Handle scroll events
let lastScrollTime = 0;
document.addEventListener('scroll', () => {
  lastScrollTime = Date.now();
  
  if (!isScrolling) {
    isScrolling = true;
    console.log('[Content] Scroll started');
    
    // Hide tooltip with fade out when scrolling starts
    const tooltip = document.getElementById('readbuddy-tooltip');
    if (tooltip && isTooltipVisible) {
      tooltip.style.transition = 'opacity 0.2s ease-out';
      tooltip.style.opacity = '0';
      setTimeout(() => {
        if (isScrolling) { // Only hide if still scrolling
          tooltip.style.display = 'none';
        }
      }, 200);
    }
  }
  
  // Clear previous timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // Set new timeout to detect scroll end
  scrollTimeout = setTimeout(() => {
    isScrolling = false;
    console.log('[Content] Scroll ended');
    
    // Re-check if text is still selected after scroll
    const selection = window.getSelection();
    const currentText = selection.toString().trim();
    
    console.log('[Content] After scroll - selected text length:', currentText.length);
    
    if (currentText && currentText.length > 10) {
      console.log('[Content] Showing tooltip after scroll stops');
      showQuickActions(currentText);
    }
  }, 150); // Show tooltip 150ms after scroll stops
}, { passive: true });

// Handle wheel events (for mouse wheel scrolling while selecting)
document.addEventListener('wheel', () => {
  lastScrollTime = Date.now();
  
  if (!isScrolling) {
    isScrolling = true;
    console.log('[Content] Wheel scroll started');
    
    const tooltip = document.getElementById('readbuddy-tooltip');
    if (tooltip && isTooltipVisible) {
      tooltip.style.transition = 'opacity 0.2s ease-out';
      tooltip.style.opacity = '0';
      setTimeout(() => {
        if (isScrolling) {
          tooltip.style.display = 'none';
        }
      }, 200);
    }
  }
  
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  scrollTimeout = setTimeout(() => {
    isScrolling = false;
    console.log('[Content] Wheel scroll ended');
    
    // Check if there's selected text after wheel scroll
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    console.log('[Content] After wheel scroll - selected text length:', text.length);
    
    if (text && text.length > 10) {
      console.log('[Content] Showing tooltip after wheel scroll');
      showQuickActions(text);
    }
  }, 150);
}, { passive: true });

function showQuickActions(text) {
  if (!isEnabled) {
    console.log('[Content] Extension disabled – no tooltip shown.');
    return;
  }

  if (!isExtensionContextValid()) {
    console.log('[Content] Extension context invalid – no tooltip shown.');
    return;
  }

  // Remove existing tooltip first
  const existingTooltip = document.getElementById('readbuddy-tooltip');
  if (existingTooltip) {
    existingTooltip.remove();
  }
  
  const selection = window.getSelection();
  if (!selection.rangeCount) {
    console.log('[Content] No selection range found');
    return;
  }
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  console.log('[Content] Creating tooltip at position:', rect.top, rect.left);
  
  const tooltip = document.createElement('div');
  tooltip.id = 'readbuddy-tooltip';
  
  // Apply Tailwind dark mode class
  if (isDarkMode) {
    tooltip.className = 'dark';
  }
  
  tooltip.innerHTML = `
    <div class="readbuddy-actions ${isDarkMode ? 'dark:bg-gray-800 dark:border-gray-700' : ''}">
      <button data-action="summarize" title="Summarize" class="${isDarkMode ? 'dark:bg-gray-700 dark:hover:bg-blue-900' : ''}">
        <span class="icon">📄</span>
      </button>
      <button data-action="translate" title="Translate" class="${isDarkMode ? 'dark:bg-gray-700 dark:hover:bg-green-900' : ''}">
        <span class="icon">🌍</span>
      </button>
      <button data-action="explain" title="Explain" class="${isDarkMode ? 'dark:bg-gray-700 dark:hover:bg-yellow-900' : ''}">
        <span class="icon">💡</span>
      </button>
      <button data-action="chat" title="Chat" class="${isDarkMode ? 'dark:bg-gray-700 dark:hover:bg-purple-900' : ''}">
        <span class="icon">💬</span>
      </button>
    </div>
  `;
  
  // Position the tooltip
  tooltip.style.position = 'fixed';
  tooltip.style.top = `${rect.top - 70}px`;
  tooltip.style.left = `${rect.left + (rect.width / 2) - 100}px`;
  tooltip.style.zIndex = '999999';
  tooltip.style.opacity = '0';
  tooltip.style.display = 'block';
  tooltip.style.transition = 'opacity 0.3s ease-in';
  
  document.body.appendChild(tooltip);
  
  // Trigger fade in animation
  requestAnimationFrame(() => {
    tooltip.style.opacity = '1';
  });
  
  isTooltipVisible = true;
  console.log('[Content] Tooltip added to DOM with dark mode:', isDarkMode);
  
  // Add click handlers
  const buttons = tooltip.querySelectorAll('button[data-action]');
  console.log('[Content] Found', buttons.length, 'buttons');
  
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const action = button.dataset.action;
      console.log('[Content] Button clicked! Action:', action);
      handleAction(action, text);
    });
  });

  setTimeout(() => {
    document.addEventListener('click', hideTooltipOnClickOutside, true);
    document.addEventListener('mousedown', hideTooltipOnClickOutside, true);
  }, 100);
}

function hideQuickActions() {
  const existingTooltip = document.getElementById('readbuddy-tooltip');
  if (existingTooltip) {
    console.log('[Content] Removing existing tooltip');
    existingTooltip.remove();
  }
  isTooltipVisible = false;
  document.removeEventListener('click', hideTooltipOnClickOutside, true);
  document.removeEventListener('mousedown', hideTooltipOnClickOutside, true);
}

function hideTooltipOnClickOutside(e) {
  const tooltip = document.getElementById('readbuddy-tooltip');
  const loader = document.getElementById('readbuddy-loader');
  
  // Don't hide if clicking on tooltip or loader
  if ((tooltip && tooltip.contains(e.target)) || (loader && loader.contains(e.target))) {
    console.log('[Content] Click on tooltip/loader, not hiding');
    return;
  }
  
  console.log('[Content] Click outside tooltip, hiding');
  hideQuickActions();
}

async function handleAction(action, text) {
  console.log('[Content] handleAction called with action:', action, 'text length:', text.length);
  
  if (!isExtensionContextValid()) {
    console.log('[Content] Extension context invalid, cannot handle action');
    hideQuickActions();
    showExtensionReloadNotification();
    return;
  }
  
  hideQuickActions();
  
  if (!text) {
    console.log('[Content] No text provided, aborting');
    return;
  }
  
  showLoadingIndicator();
  
  console.log('[Content] Sending message to background:', {
    type: 'open-sidepanel',
    action,
    textPreview: text.substring(0, 50) + '...'
  });
  
  // Send message to background to open sidepanel
  const sent = safeSendMessage({
    type: 'open-sidepanel',
    action,
    text
  }, (response) => {
    console.log('[Content] Response from background:', response);
  });
  
  if (!sent) {
    hideLoadingIndicator();
  } else {
    setTimeout(hideLoadingIndicator, 1000);
  }
}

function showLoadingIndicator() {
  console.log('[Content] Showing loading indicator');
  const loader = document.createElement('div');
  loader.id = 'readbuddy-loader';
  
  // Apply dark mode class if enabled
  if (isDarkMode) {
    loader.classList.add('dark');
  }
  
  loader.innerHTML = `
    <div class="readbuddy-spinner">
      <div class="spinner"></div>
      <span>Opening ReadBuddy...</span>
    </div>
  `;
  loader.style.position = 'fixed';
  loader.style.top = '20px';
  loader.style.right = '20px';
  loader.style.zIndex = '1000000';
  
  document.body.appendChild(loader);
}

function hideLoadingIndicator() {
  console.log('[Content] Hiding loading indicator');
  const loader = document.getElementById('readbuddy-loader');
  if (loader) {
    loader.remove();
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    console.log('[Content] Escape pressed, hiding tooltip');
    hideQuickActions();
  }
});

window.readBuddyInjected = true;

console.log('[Content] ReadBuddy extension loaded successfully!');

if (isExtensionContextValid()) {
  safeSendMessage({ type: 'content-script-ready' }, (response) => {
    console.log('[Content] Connection confirmed with background');
  });
}

console.log('[Content] ReadBuddy extension loaded successfully!');